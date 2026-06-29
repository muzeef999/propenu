// src/controller/agriculturalController.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  AgriculturalCreateSchema,
  AgriculturalUpdateSchema,
} from "../zod/agriculturalZod";
import AgriculturalService, {
  findRelatedAgriculture,
} from "../services/agriculturalServices";
import Agricultural from "../models/agriculturalModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { uploadFile } from "../utils/uploadFile";
import Location from "../models/locationModel";
import User from "../models/userModel";
import { sendManagerApprovalMail } from "../utils/sendManagerMail";
import mongoose from "mongoose";
import { deleteS3ObjectIfExists } from "../utils/s3Helpers";
import {
  sendListingApprovedAgent,
  sendListingSubmittedVerification,
} from "../../../../shared/whatsapp/whatsapp.helper";
import { sendListingApprovedEmail } from "../../../../shared/email/email.helper";
import { sendTemplateNotification } from "../../../../shared/notifications/push.service";
import {
  buildPostedByAudit,
  isDirectAgentRole,
  populateListingAuditFields,
  submitAgentListingForReview,
} from "../utils/agentSubmission";

function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

const auditUserPopulate = [
  { path: "approvedBy", select: "name email phone role roleId" },
  { path: "lastUpdatedBy.userId", select: "name email phone role roleId" },
  { path: "updateHistory.userId", select: "name email phone role roleId" },
];

const SERVER_MANAGED_STEP_FIELDS = [
  "_id",
  "id",
  "__v",
  "approval",
  "approvalStatus",
  "approvedBy",
  "approvedAt",
  "createdAt",
  "updatedAt",
  "deactivatedAt",
  "deactivatedBy",
  "isPublished",
  "lastUpdatedBy",
  "meta",
  "postedBy",
  "promotion",
  "rejectedReason",
  "slug",
  "status",
  "subscriptionEndDate",
  "updateCount",
  "updateHistory",
  "updatedBy",
];

function sanitizeStepPayload(payload: any) {
  if (!payload || typeof payload !== "object") return {};
  const sanitized = { ...payload };
  for (const field of SERVER_MANAGED_STEP_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

export const createAgricultural = async (req: Request, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      amenities: parseMaybeJSON(raw.amenities),
      borewellDetails: parseMaybeJSON(raw.borewellDetails),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
    };

    const payload = AgriculturalCreateSchema.parse(parsed) as any;
    const authUser = (req as AuthRequest).user;
    if (authUser?.id) {
      payload.createdBy ??= authUser.id;
      payload.postedBy = await buildPostedByAudit(
        Agricultural,
        payload.createdBy,
        payload.postedBy,
        authUser,
      );
    }
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const created = await AgriculturalService.create(payload as any, files);
    const fresh = created?._id
      ? await AgriculturalService.getById(String(created._id))
      : created;

    return res.status(201).json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({
        message: "Validation failed",
        issues: err.flatten().fieldErrors,
      });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("createAgricultural:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

/** LIST */
export const getAllAgricultural = async (req: Request, res: Response) => {
  try {
    const options: any = {};
    const { page, limit, q, status, city, sortBy, sortOrder, createdBy } =
      req.query;
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof city === "string") options.city = city;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    if (typeof sortOrder === "string")
      options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    if (typeof createdBy === "string") {
      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({ error: "Invalid createdBy" });
      }
      options.createdBy = createdBy;
    }

    const result = await AgriculturalService.list(options);
    const formattedItems = result.items.map((item: any) => ({
      ...item,
      displayType: item.promotion?.type || "normal",
    }));

    return res.json({
      ...result,
      items: formattedItems,
    });
  } catch (err: any) {
    console.error("getAllAgricultural:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getMyAgriculturalDraft = async (
  req: AuthRequest,
  res: Response,
) => {
  const statusFilter = isDirectAgentRole(req.user?.roleName)
    ? "draft"
    : { $in: ["draft", "pending"] };

  const draft = await Agricultural.findOne({
    createdBy: req.user!.id,
    status: statusFilter,
  })
    .populate("createdBy", "name email phone role roleId")
    .populate("createdBy.roleId", "name label")
    .populate(auditUserPopulate)
    .lean();

  if (!draft) {
    return res.status(404).json({ message: "No draft found" });
  }

  res.json({ data: draft });
};

/** GET BY SLUG */
export const getAgriculturalBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }
    const property = await AgriculturalService.getBySlug(slug);
    if (!property) {
      return res.status(404).json({ error: "Not found" });
    }
    const id = (property as any)?._id?.toString?.();
    if (id) {
      AgriculturalService.incrementViews(id).catch((e: any) =>
        console.error("incrementViews:", e),
      );
    }

    const relatedProjects = await findRelatedAgriculture(property);

    return res.json({ data: property, relatedProjects });
  } catch (err: any) {
    console.error("getAgriculturalBySlug:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};

/** GET DETAIL BY ID */
export const getAgriculturalDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const doc = await AgriculturalService.getById(id, true);
    if (!doc) return res.status(404).json({ error: "Not found" });

    AgriculturalService.incrementViews(id).catch((e) =>
      console.error("incrementViews:", e),
    );
    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getAgriculturalDetail:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

/** UPDATE */
export const editAgricultural = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const raw = { ...(req.body || {}) };

    const parsed = {
      ...raw,
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      amenities: parseMaybeJSON(raw.amenities),
      borewellDetails: parseMaybeJSON(raw.borewellDetails),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
    };

    const payload = AgriculturalUpdateSchema.parse(parsed);
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const updated = await AgriculturalService.update(id, payload as any, files);
    if (!updated) return res.status(404).json({ error: "Not found" });

    const fresh = await AgriculturalService.getById(id);

    return res.json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({
        message: "Validation failed",
        issues: err.flatten().fieldErrors,
      });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("editAgricultural:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/** DELETE */
export const deleteAgricultural = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const deleted = await AgriculturalService.delete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const createAgriculturalDraft = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const statusFilter = isDirectAgentRole(req.user?.roleName)
      ? "draft"
      : { $in: ["draft", "pending"] };

    const existing = await Agricultural.findOne({
      createdBy: req.user!.id,
      status: statusFilter,
    }).lean();

    if (existing) {
      const populated = await populateListingAuditFields(Agricultural, existing._id);
      return res.status(200).json({ data: populated ?? existing });
    }

    const draft = await Agricultural.create({
      createdBy: req.user!.id,
      status: "draft",
      title: "Draft Agricultural Property", // explicit
      completion: {
        percent: 0,
        step: 1,
        lastSection: "basic",
      },
    });

    const populated = await populateListingAuditFields(Agricultural, draft._id);
    return res.status(201).json({ data: populated ?? draft });
  } catch (err: any) {
    console.error("createAgriculturalDraft:", err);
    return res.status(500).json({
      error: "Failed to create agricultural draft",
    });
  }
};

export const updateAgriculturalBasicStep = async (
  req: AuthRequest,
  res: Response,
) => {
  const doc = await Agricultural.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Agricultural draft not found" });
  }

  Object.assign(doc, sanitizeStepPayload(req.body));

  doc.completion = {
    ...doc.completion,
    percent: 25,
    step: 2,
    lastSection: "basic",
  };

  await doc.save(); // 🔥 title builds here

  const fresh = await populateListingAuditFields(Agricultural, doc._id);
  res.json({ data: fresh ?? doc });
};

export const updateAgriculturalLocationStep = async (
  req: AuthRequest,
  res: Response,
) => {
  const doc = await Agricultural.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Agricultural draft not found" });
  }

  Object.assign(doc, {
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    locality: req.body.locality,
    location: parseMaybeJSON(req.body.location),
    landName: req.body.landName,
    nearbyPlaces: req.body.nearbyPlaces,
  });

  doc.completion = {
    ...doc.completion,
    percent: 45,
    step: 3,
    lastSection: "location",
  };

  await doc.save(); // 🔥 title rebuilds with city + locality

  if (doc.city && doc.locality) {
    const coordinates = doc.location?.coordinates || [0, 0];

    // Step 1 — find city doc
    let cityDoc = await Location.findOne({
      city: doc.city,
      state: doc.state,
    });

    // Step 2 — if city not exists → create
    if (!cityDoc) {
      await Location.create({
        city: doc.city,
        state: doc.state,
        category: "agricultural",
        localities: [
          {
            name: doc.locality,
            location: {
              type: "Point",
              coordinates,
            },
          },
        ],
      });
    } else {
      // Step 3 — check if locality exists
      const exists = cityDoc.localities.some(
        (loc: any) => loc.name.toLowerCase() === doc.locality.toLowerCase(),
      );

      // Step 4 — push new locality if not exists
      if (!exists) {
        cityDoc.localities.push({
          name: doc.locality,
          location: {
            type: "Point",
            coordinates,
          },
        });

        await cityDoc.save();
      }
    }
  }

  const fresh = await populateListingAuditFields(Agricultural, doc._id);
  res.json({ data: fresh ?? doc });
};

export const updateAgriculturalDetailsStep = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1️⃣ Multer files (DO NOT hardcode)
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    // 2️⃣ Parse JSON fields safely
    const parsed = {
      ...req.body,
      totalArea: parseMaybeJSON(req.body.totalArea),
      roadWidth: parseMaybeJSON(req.body.roadWidth), // ✅ fixed casing
      borewellDetails: parseMaybeJSON(req.body.borewellDetails),
      amenities: parseMaybeJSON(req.body.amenities),
      location: parseMaybeJSON(req.body.location),
      gallery: parseMaybeJSON(req.body.gallery), // optional (if frontend sends JSON)
      documents: parseMaybeJSON(req.body.documents),
    };

    // 3️⃣ Validate payload
    const payload = AgriculturalUpdateSchema.parse(parsed);

    // 4️⃣ Update via service (files handled there)
    const updated = await AgriculturalService.update(
      req.params.id,
      {
        ...payload,
        completion: {
          percent: 70,
          step: 4,
          lastSection: "details",
        },
      },
      files,
    );

    if (!updated) {
      return res.status(404).json({ error: "Agricultural property not found" });
    }

    // 5️⃣ Fetch fresh doc (with gallery, title, slug)
    // const fresh = await Agricultural.findById(req.params.id)

    if (isDirectAgentRole(req.user?.roleName)) {
      const submitted = await submitAgentListingForReview(
        Agricultural,
        req.params.id,
        req.user,
      );
      return res.json({ data: submitted ?? updated });
    }

    const fresh = await populateListingAuditFields(Agricultural, req.params.id);
    return res.json({ data: fresh ?? updated });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({
        message: "Validation failed",
        issues: err.flatten().fieldErrors,
      });
    }

    console.error("updateAgriculturalDetailsStep:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const finalizeAgricultural = async (req: AuthRequest, res: Response) => {
  try {
    const property = await Agricultural.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;
    const verificationFiles = files?.verificationDocuments ?? [];

    // ---------- Upload Docs ----------
    if (verificationFiles.length > 0) {
      property.verificationDocuments ??= [];

      for (const file of verificationFiles) {
        const up = await uploadFile({
          filePath: file.path,
          originalName: file.originalname,
          mimetype: file.mimetype,
          folder: "agricultural/verification",
          entityId: property._id.toString(),
        });

        property.verificationDocuments.push({
          type: req.body.verificationType,
          title: file.originalname,
          url: up.url,
          key: up.key,
          filename: file.originalname,
          mimetype: file.mimetype,
          status: "pending",
        });
      }
    }

    // ---------- Check verified ----------
    const hasVerified = Boolean(
      property.verificationDocuments?.some(
        (doc: any) => doc.status === "verified",
      ),
    );
    const hasVerificationDocuments = Boolean(
      property.verificationDocuments?.length,
    );

    property.completion ??= {
      percent: 0,
      step: 1,
      lastSection: "verification",
    };

    property.completion.lastSection = "verification";

    const role = req.user?.roleName;

    if (verificationFiles.length > 0) {
      if (role === "sales_agent") {
        property.status = "pending";
        property.isPublished = false;
        property.completion.percent = 80;
        property.completion.step = 4;

        property.approval ??= {};
        property.approval.isApprovedByManager = false;
        property.approval.approvalToken = crypto.randomUUID();

        const agent = await User.findById(property.createdBy).populate(
          "managerId",
        );

        if (agent?.managerId && (agent.managerId as any).email) {
          await sendManagerApprovalMail({
            managerEmail: (agent.managerId as any).email,
            property: {
              id: property._id,
              title: property.title,
              price: property.price,
              city: property.city,
              locality: property.locality,
              image: property.gallery?.[0]?.url,
              area: property.totalArea?.value,
            },
            agent: {
              name: agent.name,
              email: agent.email,
            },
            token: property.approval.approvalToken,
          });
        }
      } else if (hasVerified) {
        property.status = "active";
        property.isPublished = true;
        property.completion.percent = 100;
        property.completion.step = 5;
      } else {
        property.status = "pending";
        property.isPublished = false;
        property.completion.percent = 80;
        property.completion.step = 4;
      }
    } else if (hasVerificationDocuments) {
      property.status = hasVerified ? "active" : "pending";
      property.isPublished = hasVerified;
      property.completion.percent = hasVerified ? 100 : 80;
      property.completion.step = hasVerified ? 5 : 4;
    } else {
      property.status = "draft";
      property.isPublished = false;
      property.completion.percent = 80;
      property.completion.step = 4;
    }

    if (property.status !== "draft") {
      property.postedBy = await buildPostedByAudit(
        Agricultural,
        property.createdBy,
        property.postedBy,
        req.user,
      );
    }

    await property.save();
    const fresh = await Agricultural.findById(property._id)
      .populate("createdBy", "name email phone role roleId")
      .populate("createdBy.roleId", "name label")
      .lean();

    try {
      const owner: any = fresh?.createdBy;

      if (owner?.phone && owner?.name) {
        console.log("📩 Sending listing submitted WhatsApp message...");

        await sendListingSubmittedVerification(
          owner.phone,
          owner.name,
          property.title || "Property",
        );

        console.log("✅ Listing submitted WhatsApp sent");
      }
    } catch (err) {
      console.error("⚠️ WhatsApp listing message failed:", err);
    }

    return res.json({
      success: true,
      verified: hasVerified,
      data: fresh,
    });
  } catch (err: any) {
    console.error("finalizeAgricultural:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getAllAgriculturalDraftsForAdmin = async (
  req: Request,
  res: Response,
) => {
  const { page = "1", limit = "20", q, city, userId } = req.query;

  const filter: any = { status: "draft" };

  if (city) filter.city = city;
  if (userId) filter.createdBy = userId;

  if (q) {
    filter.$or = [
      { title: new RegExp(q as string, "i") },
      { locality: new RegExp(q as string, "i") },
      { city: new RegExp(q as string, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Agricultural.find(filter)
      .populate("createdBy", "name email phone role roleId")
      .populate("createdBy.roleId", "name label")
      .populate(auditUserPopulate)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Agricultural.countDocuments(filter),
  ]);

  res.json({
    items,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const verifyAgricultiralDocument = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    let { documentIndex, status = "verified", rejectedReason = "" } =
      req.body ?? {};

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status (must be verified or rejected)",
      });
    }

    if (status === "rejected" && typeof rejectedReason !== "string") {
      return res.status(400).json({
        success: false,
        message: "Rejected reason must be a string",
      });
    }

    documentIndex =
      documentIndex === undefined || documentIndex === null || documentIndex === ""
        ? 0
        : Number(documentIndex);

    if (!Number.isInteger(documentIndex) || documentIndex < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid document index (must be zero or a positive integer)",
      });
    }

    const existingProperty = await Agricultural.findById(id).select("status");

    const updated = await AgriculturalService.verifyDocument(
      id,
      documentIndex,
      status,
      rejectedReason,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if ((updated as any).success === false) {
      return res.status((updated as any).status || 400).json(updated);
    }

    const notificationStatus = {
      email: false,
      whatsapp: false,
      push: false,
    };

    if (existingProperty?.status !== "active" && updated.status === "active") {
      try {
        const userId = (updated as any).createdBy || (updated as any).ownerId;
        const user = await User.findById(userId).lean();
        const propertyTitle = (updated as any).title || "Property";
        const propertyLocation =
          (updated as any).city || (updated as any).locality || "your area";
        const propertiesLink = `${process.env.FRONTEND_URL || "https://propenu.com"}/agent/my-properties`;

        if (user?.email && user?.name) {
          await sendListingApprovedEmail(
            user.email,
            user.name,
            propertyTitle,
            {
              roleName: "sales_agent",
              location: propertyLocation,
              link: propertiesLink,
            },
          );
          notificationStatus.email = true;
        }

        if (user?.phone && user?.name) {
          await sendListingApprovedAgent(user.phone, [user.name, propertyTitle]);
          notificationStatus.whatsapp = true;
        }

        if (user?.fcmToken) {
          await sendTemplateNotification({
            token: user.fcmToken,
            templateKey: "PROPERTY_APPROVED",
            data: {
              name: user.name || "User",
              propertyTitle,
            },
          });
          notificationStatus.push = true;
        }
      } catch (notifyError) {
        console.error("Notification error:", notifyError);
      }
    }

    if (status === "rejected") {
      const userId = (updated as any).createdBy || (updated as any).ownerId;
      const user = await User.findById(userId).lean();
      const propertyTitle = (updated as any).title || "Property";
      const reason = (updated as any).rejectedReason || "";

      if (user?.fcmToken) {
        await sendTemplateNotification({
          token: user.fcmToken,
          templateKey: "PROPERTY_REJECTED",
          data: {
            name: user.name || "User",
            propertyTitle,
            rejectedReason: reason,
          },
        });
      }
    }

    res.json({
      success: true,
      verified: updated.status === "active",
      notifications: notificationStatus,
      data: updated,
    });
  } catch (err: any) {
    console.error("verifyResidentialDocument:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const approveAgriculturalProperty = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const property = await Agricultural.findById(id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    if (!property.approval?.approvalToken)
      return res.status(400).json({ message: "No approval required" });

    if (property.approval.approvalToken !== token)
      return res.status(400).json({ message: "Invalid approval link" });

    /* ✅ UPDATE PROPERTY */
    property.status = "active";
    property.isPublished = true;

    /* ✅ UPDATE APPROVAL */
    property.approval.status = "approved";
    property.approval.isApprovedByManager = true;
    property.approval.approvedAt = new Date();

    /* optional security */
    property.approval.approvalToken = undefined;

    await property.save();

    const notificationStatus = {
      email: false,
      whatsapp: false,
      push: false,
    };

    try {
      const agent = await User.findById(property.createdBy).lean();
      const propertyTitle = property.title || "Property";
      const propertyLocation = property.city || property.locality || "your area";
      const propertiesLink = `${process.env.FRONTEND_URL || "https://propenu.com"}/agent/my-properties`;

      if (agent?.email && agent?.name) {
        await sendListingApprovedEmail(
          agent.email,
          agent.name,
          propertyTitle,
          {
            roleName: "sales_agent",
            location: propertyLocation,
            link: propertiesLink,
          },
        );
        notificationStatus.email = true;
      }

      if (agent?.phone && agent?.name) {
        await sendListingApprovedAgent(agent.phone, [
          agent.name,
          propertyTitle,
        ]);
        notificationStatus.whatsapp = true;
      }

      if (agent?.fcmToken) {
        await sendTemplateNotification({
          token: agent.fcmToken,
          templateKey: "PROPERTY_APPROVED",
          data: {
            name: agent.name || "User",
            propertyTitle,
          },
        });
        notificationStatus.push = true;
      }
    } catch (err) {
      console.error("Approval notification sending failed:", err);
    }

    res.json({
      success: true,
      message: "Property approved successfully",
      propertyId: property._id,
      notifications: notificationStatus,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const deactivateAgriculturalProperty = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const property = await Agricultural.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.status = "deactivated";
    property.isPublished = false;
    property.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await property.save();

    res.json({
      success: true,
      message: "Property deactivated",
      data: property,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteAgriculturalGalleryImage = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id, imageIndex } = req.params;
    if (!id || imageIndex === undefined) {
      return res.status(400).json({ message: "Missing params" });
    }
    const property = await Agricultural.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const index = Number(imageIndex);
    if (!property.gallery?.[index]) {
      return res.status(404).json({ message: "Image not found" });
    }
    const image = property.gallery[index];

    // ✅ Delete from S3
    if (image.key) {
      await deleteS3ObjectIfExists(image.key);
    }

    // ✅ Remove from DB
    property.gallery.splice(index, 1);

    await property.save();

    res.json({ success: true, data: property.gallery });
  } catch (err: any) {
    console.error("deleteGalleryImage:", err);
    res.status(500).json({ message: err.message });
  }
};
