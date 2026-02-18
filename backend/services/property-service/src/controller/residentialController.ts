// src/controllers/residential.controller.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  ResidentialCreateSchema,
  ResidentialUpdateSchema,
} from "../zod/residentialZod";
import ResidentialPropertyService, {
  findRelatedResidential,
} from "../services/residentialServices";
import { AuthRequest } from "../middlewares/authMiddleware";
import Residential from "../models/residentialModel";
import { uploadFile } from "../utils/uploadFile";
import Location from "../models/locationModel";
import User from "../models/userModel";
import { sendManagerApprovalMail } from "../utils/sendManagerMail";
import mongoose from "mongoose";

/** Helper: parse values that might be JSON strings (multipart sends arrays/objects as strings). */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/*** CREATE*/
export const createResidential = async (req: AuthRequest, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };

    const parsed = {
      ...raw,
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallery: parseMaybeJSON(raw.gallery),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      parkingDetails: parseMaybeJSON(raw.parkingDetails),
      verificationDocuments: parseMaybeJSON(raw.verificationDocuments),
      security: parseMaybeJSON(raw.security),
      fireSafetyDetails: parseMaybeJSON(raw.fireSafetyDetails),
      greenCertification: parseMaybeJSON(raw.greenCertification),
      smartHomeFeatures: parseMaybeJSON(raw.smartHomeFeatures),
      relatedProjects: parseMaybeJSON(raw.relatedProjects),
    };

    const payload = ResidentialCreateSchema.parse(parsed);

    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const created = await ResidentialPropertyService.create(
      { ...payload, createdBy: req.user!.id, status: "active" },
      files,
    );

    const fresh = created?._id
      ? await ResidentialPropertyService.getById(String(created._id))
      : created;

    return res.status(201).json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("createResidential:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

/*** LIST **/
export const getAllResidential = async (req: Request, res: Response) => {
  try {
    const options: any = {};
    const {
      page,
      limit,
      q,
      status,
      sortBy,
      sortOrder,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      near,
      maxDistance,
    } = req.query;

    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    if (typeof sortOrder === "string")
      options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    if (typeof city === "string") options.city = city;
    if (typeof minPrice === "string") options.minPrice = Number(minPrice);
    if (typeof maxPrice === "string") options.maxPrice = Number(maxPrice);
    if (typeof bedrooms === "string") options.bedrooms = Number(bedrooms);
    if (typeof bathrooms === "string") options.bathrooms = Number(bathrooms);
    if (typeof near === "string") options.near = near;
    if (typeof maxDistance === "string")
      options.maxDistance = Number(maxDistance);

    const result = await ResidentialPropertyService.list(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllResidential:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getMyResidentialDraft = async (
  req: AuthRequest,
  res: Response,
) => {
  const draft = await Residential.findOne({
    createdBy: req.user!.id,
    status: { $in: ["draft", "pending"] },
  })
    .populate("createdBy", "name email phone")
    .lean();

  if (!draft) {
    return res.status(404).json({ message: "No draft found" });
  }

  res.json({ data: draft });
};

/*** GET BY SLUG **/
export const getResidentialBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // 1️⃣ Fetch property
    const property = await ResidentialPropertyService.getBySlug(slug);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const id = (property as any)._id?.toString?.();
    if (id) {
      ResidentialPropertyService.incrementViews(id).catch((e: any) =>
        console.error("incrementViews error:", e),
      );
    }

    const relatedProjects = await findRelatedResidential(property);

    return res.json({
      data: property,
      relatedProjects,
    });
  } catch (err: any) {
    console.error("getResidentialBySlug:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};

/*** GET DETAIL BY ID **/
export const getResidentialDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const doc = await ResidentialPropertyService.getById(id);
    if (!doc) return res.status(404).json({ error: "Property not found" });

    // increment views (non-blocking)
    ResidentialPropertyService.incrementViews(id).catch((e: any) =>
      console.error("incrementViews error:", e),
    );

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getResidentialDetail:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/***  UPDATE  **/
export const editResidential = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      // removed bhkSummary & images parsing (no longer in model)
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallery: parseMaybeJSON(raw.gallery),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      verificationDocuments: parseMaybeJSON(raw.verificationDocuments),
      parkingDetails: parseMaybeJSON(raw.parkingDetails),
      security: parseMaybeJSON(raw.security),
      fireSafetyDetails: parseMaybeJSON(raw.fireSafetyDetails),
      greenCertification: parseMaybeJSON(raw.greenCertification),
      smartHomeFeatures: parseMaybeJSON(raw.smartHomeFeatures),
      relatedProjects: parseMaybeJSON(raw.relatedProjects),
    };

    const payload = ResidentialUpdateSchema.parse(parsed);

    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const updated = await ResidentialPropertyService.update(
      id,
      payload as any,
      files,
    );
    if (!updated) return res.status(404).json({ error: "Property not found" });

    const fresh = await ResidentialPropertyService.getById(id);
    return res.json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("editResidential:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/*** DELETE **/
export const deleteResidential = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });
    const deleted = await ResidentialPropertyService.delete(id);
    if (!deleted) return res.status(404).json({ error: "Property not found" });
    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteResidential:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const createResidentialDraft = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const existing = await Residential.findOne({
      createdBy: req.user!.id,
      status: "draft",
    }).lean();

    if (existing) {
      return res.status(200).json({ data: existing });
    }

    const draft = await Residential.create({
      createdBy: req.user!.id,
      status: "draft",
      title: "Draft Residential Property", // explicit
      completion: {
        percent: 0,
        step: 1,
        lastSection: "basic",
      },
    });

    return res.status(201).json({ data: draft });
  } catch (err: any) {
    console.error("createResidentialDraft:", err);
    return res.status(500).json({
      error: "Failed to create residential draft",
    });
  }
};

export const updateBasicStep = async (req: AuthRequest, res: Response) => {
  const doc = await Residential.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Property not found" });
  }

  const { approval, ...safeBody } = req.body;

  Object.assign(doc, safeBody, {
    completion: {
      ...doc.completion,
      percent: 25,
      step: 2,
      lastSection: "basic",
    },
  });

  await doc.save(); // 🔥 triggers buildResidentialTitle

  res.json({ data: doc });
};

export const updateLocationStep = async (req: AuthRequest, res: Response) => {
  const doc = await Residential.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Property not found" });
  }

  Object.assign(doc, {
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    locality: req.body.locality,
    location: req.body.location,
    buildingName: req.body.buildingName,
    completion: {
      ...doc.completion,
      percent: 45,
      step: 3,
      lastSection: "location",
    },
  });

  await doc.save();

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
        category: "residential",
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

export const updateDetailsStep = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as
      | { [field: string]: Express.Multer.File[] }
      | undefined;

    const updated = await ResidentialPropertyService.update(
      req.params.id,
      {
        ...req.body,
        completion: {
          percent: 70,
          step: 4,
          lastSection: "details",
        },
      },
      files,
    );

    if (!updated) {
      return res.status(404).json({ error: "Residential property not found" });
    }

    res.json({ data: updated });
  } catch (err: any) {
    console.error("updateDetailsStep:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const finalizeResidential = async (req: AuthRequest, res: Response) => {
  try {

    const property = await Residential.findById(req.params.id);
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
          folder: "residential/verification",
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
      (d: any) => d.status === "verified",
    );

    property.completion ??= {
      percent: 0,
      step: 1,
      lastSection: "verification",
    };

    property.completion.lastSection = "verification";

    const role = req.user?.roleName;


    if (hasVerified) {

      if (role === "sales_agent") {
        // 👉 Send to manager


        property.status = "pending";
        property.isPublished = false;

        property.approval ??= {};
        property.approval.isApprovedByManager = false;
        property.approval.approvalToken = crypto.randomUUID();

        const agent = await User.findById(property.createdBy).populate(
          "managerId",
        );

        console.log("AGENT:", agent?.name);
        console.log("MANAGER:", agent?.managerId);
        console.log("MANAGER EMAIL:", (agent?.managerId as any)?.email);

        if (agent?.managerId && (agent.managerId as any).email) {
          await sendManagerApprovalMail({
            managerEmail: (agent.managerId as any).email,
            propertyId: property._id.toString(),
            token: property.approval.approvalToken,
          });
        }
      } else {
        // 👉 Normal user
        property.status = "active";
        property.isPublished = true;
        property.completion.percent = 100;
        property.completion.step = 5;
      }
    } else {
      property.status = "pending";
      property.isPublished = false;
      property.completion.percent = 80;
      property.completion.step = 4;
    }

    await property.save();

    const fresh = await Residential.findById(property._id)
      .populate("createdBy", "name email phone")
      .lean();

    res.json({ success: true, verified: hasVerified, data: fresh });
  } catch (err: any) {
    console.error("finalizeResidential:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllResidentialDraftsForAdmin = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      page = "1",
      limit = "20",
      q,
      userId,
      city,
      status = "draft",
    } = req.query;

    const filter: any = { status };

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
      Residential.find(filter)
        .populate("createdBy", "name email phone")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Residential.countDocuments(filter),
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
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const verifyResidentialDocument = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { documentIndex, status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await ResidentialPropertyService.verifyDocument(
      id,
      documentIndex,
      status,
    );

    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({
      success: true,
      verified: updated.status === "active",
      data: updated,
    });
  } catch (err: any) {
    console.error("verifyResidentialDocument:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

export const approveProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const property = await Residential.findById(id);

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    if (!property.approval || !property.approval.approvalToken) {
      return res.status(400).json({
        message: "Property does not require approval",
      });
    }

    if (property.approval.approvalToken !== token) {
      return res.status(400).json({
        message: "Invalid approval link",
      });
    }

    property.status = "active";
    property.isPublished = true;

    property.approval.isApprovedByManager = true;
    property.approval.approvedByManager = new mongoose.Types.ObjectId(
      req.user!.sub,
    ); // ✅ FIX
    property.approval.approvedAt = new Date();

    await property.save();

    res.json({ message: "Property approved successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
