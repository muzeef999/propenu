import { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateLandSchema, UpdateLandSchema } from "../zod/landZod";
import LandService, { findRelatedLand } from "../services/landService";
import { AuthRequest } from "../middlewares/authMiddleware";
import LandPlot from "../models/landModel";
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

/** helper to parse JSON-like values already handled by middleware; keep for safety */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/** CREATE */
export const createLand = async (req: Request, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      approvedByAuthority: parseMaybeJSON(raw.approvedByAuthority),
      // soilTestReport / conversionCertificateFile / encumbranceCertificateFile
      soilTestReport: parseMaybeJSON(raw.soilTestReport),
      conversionCertificateFile: parseMaybeJSON(raw.conversionCertificateFile),
      encumbranceCertificateFile: parseMaybeJSON(
        raw.encumbranceCertificateFile,
      ),
    };

    // validate (throws ZodError)
    const payload = CreateLandSchema.parse(parsed);

    console.log(payload);
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const created = await LandService.create(payload as any, files);

    // return created document (lean)
    return res.status(201).json({ data: created });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("createLand:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

/** LIST */
export const getAllLands = async (req: Request, res: Response) => {
  try {
    // simple pagination/filtering
    const options: any = {};
    const { page, limit, q, city, status } = req.query;
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof city === "string") options.city = city;
    if (typeof status === "string") options.status = status;

    const result = await LandService.list(options);

    const formattedItems = result.items.map((item: any) => ({
      ...item,
      displayType: item.promotion?.type || "normal",
    }));

    return res.json({
      ...result,
      items: formattedItems,
    });
  } catch (err: any) {
    console.error("getAllLands:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getMyLandDraft = async (req: AuthRequest, res: Response) => {
  const draft = await LandPlot.findOne({
    createdBy: req.user!.id,
    status: "draft",
  })
    .populate("createdBy", "name email phone")
    .lean();

  if (!draft) {
    return res.status(404).json({ error: "No draft found for this user" });
  }

  res.json({ data: draft });
};

/** GET BY SLUG */
export const getLandBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // 1️⃣ Fetch property
    const property = await LandService.getBySlug(slug);
    if (!property) {
      return res.status(404).json({ error: "Not found" });
    }

    // 2️⃣ Increment views (fire-and-forget)
    const id = (property as any)._id?.toString?.();
    if (id) {
      LandService.incrementViews(id).catch((e: any) =>
        console.error("incrementViews error:", e),
      );
    }

    // 3️⃣ Find related land properties
    const relatedProjects = await findRelatedLand(property);

    // 4️⃣ Response
    return res.json({
      data: property,
      relatedProjects,
    });
  } catch (err: any) {
    console.error("getLandBySlug:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};

/** GET DETAIL BY ID */
export const getLandDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const doc = await LandService.getById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });

    LandService.incrementViews(id).catch((e) =>
      console.error("incrementViews error:", e),
    );

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getLandDetail:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/** UPDATE */
export const editLand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      approvedByAuthority: parseMaybeJSON(raw.approvedByAuthority),
      soilTestReport: parseMaybeJSON(raw.soilTestReport),
      conversionCertificateFile: parseMaybeJSON(raw.conversionCertificateFile),
      encumbranceCertificateFile: parseMaybeJSON(
        raw.encumbranceCertificateFile,
      ),
    };

    const payload = UpdateLandSchema.parse(parsed);

    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const updated = await LandService.update(id, payload as any, files);
    if (!updated) return res.status(404).json({ error: "Not found" });

    const fresh = await LandService.getById(id);
    return res.json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("editLand:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/** DELETE */
export const deleteLand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const deleted = await LandService.delete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    return res.json({ data: deleted, message: "Deleted" });
  } catch (err: any) {
    console.error("deleteLand:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const createLandDraft = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await LandPlot.findOne({
      createdBy: req.user!.id,
      status: "draft",
    }).lean();

    if (existing) {
      return res.status(200).json({ data: existing });
    }

    const draft = await LandPlot.create({
      createdBy: req.user!.id,
      status: "draft",
      title: "Draft Land Plot Property", // explicit
      completion: {
        percent: 0,
        step: 1,
        lastSection: "basic",
      },
    });

    return res.status(201).json({ data: draft });
  } catch (err: any) {
    console.error("createLandDraft:", err);
    return res.status(500).json({
      error: "Failed to create land draft",
    });
  }
};

export const updateLandBasicStep = async (req: AuthRequest, res: Response) => {
  const doc = await LandPlot.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Land draft not found" });
  }

  Object.assign(doc, req.body);

  doc.completion = {
    ...doc.completion,
    percent: 25,
    step: 2,
    lastSection: "basic",
  };

  await doc.save(); // 🔥 title + slug build here

  res.json({ data: doc });
};

export const updateLandLocationStep = async (
  req: AuthRequest,
  res: Response,
) => {
  const doc = await LandPlot.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Land draft not found" });
  }

  Object.assign(doc, {
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    locality: req.body.locality,
    location: req.body.location,
    landName: req.body.landName,
    nearbyPlaces: req.body.nearbyPlaces,
  });

  doc.completion = {
    ...doc.completion,
    percent: 45,
    step: 3,
    lastSection: "location",
  };

  await doc.save(); // 🔥 title improves with location

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
        category: "land",
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

  res.json({ data: doc });
};

export const updateLandDetailsStep = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const parsed = {
      ...req.body,
      approvedByAuthority: parseMaybeJSON(req.body.approvedByAuthority),
      dimensions: parseMaybeJSON(req.body.dimensions),
    };

    const updated = await LandService.update(
      req.params.id,
      {
        ...parsed,
        completion: {
          percent: 70,
          step: 4,
          lastSection: "details",
        },
      },
      files,
    );

    if (!updated) {
      return res.status(404).json({ error: "Land draft not found" });
    }

    const fresh = await LandService.getById(req.params.id);
    res.json({ data: fresh });
  } catch (err: any) {
    console.error("updateLandDetailsStep:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const finalizeLand = async (req: AuthRequest, res: Response) => {
  try {
    const property = await LandPlot.findById(req.params.id);
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
          buffer: file.buffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          folder: "land/verification",
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
    const hasVerified = property.verificationDocuments?.some(
      (doc: any) => doc.status === "verified",
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
              area: property.plotArea,
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
        property.status = "draft";
        property.isPublished = false;
        property.completion.percent = 80;
        property.completion.step = 4;
      }
    } else {
      property.status = "draft";
      property.isPublished = false;
      property.completion.percent = 80;
      property.completion.step = 4;
    }

    await property.save();

    const fresh = await LandPlot.findById(property._id)
      .populate("createdBy", "name email phone")
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
    console.error("finalizeLand:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getAllLandDraftsForAdmin = async (req: Request, res: Response) => {
  try {
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
      LandPlot.find(filter)
        .populate("createdBy", "name email phone")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      LandPlot.countDocuments(filter),
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
  } catch (err: any) {
    console.error("getAllLandDraftsForAdmin:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const verifyLandDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { documentIndex, status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingProperty = await LandPlot.findById(id).select("status");

    const updated = await LandService.verifyDocument(id, documentIndex, status);

    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
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

      if (user?.fcmToken) {
        await sendTemplateNotification({
          token: user.fcmToken,
          templateKey: "PROPERTY_REJECTED",
          data: {
            name: user.name || "User",
            propertyTitle,
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

export const approveLandProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const property = await LandPlot.findById(id);
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

export const deactivateLandProperty = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const property = await LandPlot.findById(id);
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

export const deleteLandGalleryImage = async (req: Request, res: Response) => {
  try {
    const { id, imageIndex } = req.params;
    if (!id || imageIndex === undefined) {
      return res.status(400).json({ message: "Missing params" });
    }
    const property = await LandPlot.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const index = Number(imageIndex);
    if (!property.gallery?.[index]) {
      return res.status(404).json({ message: "Image not found" });
    }
    const image = property.gallery[index];
    if (image.key) {
      await deleteS3ObjectIfExists(image.key);
    }
    property.gallery.splice(index, 1);
    await property.save();
    res.json({ success: true, data: property.gallery });
  } catch (err: any) {
    console.error("deleteGalleryImage:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
