// src/controller/agriculturalController.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import { AgriculturalCreateSchema, AgriculturalUpdateSchema} from "../zod/agriculturalZod";
import AgriculturalService, { findRelatedAgriculture} from "../services/agriculturalServices";
import Agricultural from "../models/agriculturalModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { uploadFile } from "../utils/uploadFile";
import { issue } from "zod/v4/core/util.cjs";
 
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}
 
 
export const createAgricultural = async (req: Request, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      borewellDetails: parseMaybeJSON(raw.borewellDetails),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
    };
 
    const payload = AgriculturalCreateSchema.parse(parsed);
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
      return res
        .status(422)
        .json({
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
    const { page, limit, q, status, city, sortBy, sortOrder } = req.query;
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof city === "string") options.city = city;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    if (typeof sortOrder === "string")
      options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
 
    const result = await AgriculturalService.list(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllAgricultural:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getMyAgriculturalDraft = async (req: AuthRequest, res: Response) => {
  const draft = await Agricultural.findOne({
    createdBy: req.user!.id,
    status: "draft",
  })
    .populate("createdBy", "name email phone")
    .lean();
 
  if (!draft) {
    return res.status(404).json({ message: "No draft found" });
  }
 
  res.json({ data: draft });
}
 
 
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
        console.error("incrementViews:", e)
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
 
    const doc = await AgriculturalService.getById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
 
    AgriculturalService.incrementViews(id).catch((e) =>
      console.error("incrementViews:", e)
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
      return res
        .status(422)
        .json({
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
 
 
export const createAgriculturalDraft = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Agricultural.findOne({
      createdBy: req.user!.id,
      status: "draft",
    }).lean();

    if (existing) {
      return res.status(200).json({ data: existing });
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

    return res.status(201).json({ data: draft });
  } catch (err: any) {
    console.error("createAgriculturalDraft:", err);
    return res.status(500).json({
      error: "Failed to create agricultural draft",
    });
  }
};
 
export const updateAgriculturalBasicStep = async (
  req: AuthRequest,
  res: Response
) => {
  const doc = await Agricultural.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Agricultural draft not found" });
  }

  // assign only basic fields
  Object.assign(doc, req.body);

  doc.completion = {
    ...doc.completion,
    percent: 25,
    step: 2,
    lastSection: "basic",
  };

  await doc.save(); // 🔥 title builds here

  res.json({ data: doc });
};

 
export const updateAgriculturalLocationStep = async (
  req: AuthRequest,
  res: Response
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
    location: req.body.location,
      landName: req.body.landName,
  });

  doc.completion = {
    ...doc.completion,
    percent: 45,
    step: 3,
    lastSection: "location",
  };

  await doc.save(); // 🔥 title rebuilds with city + locality

  res.json({ data: doc });
};

 
 
export const updateAgriculturalDetailsStep = async (
  req: AuthRequest,
  res: Response
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
      files
    );

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Agricultural property not found" });
    }

    // 5️⃣ Fetch fresh doc (with gallery, title, slug)
    // const fresh = await Agricultural.findById(req.params.id)

    return res.json({ data: updated });
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
  const property = await Agricultural.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }
 
  const files = req.files as
    | { [field: string]: Express.Multer.File[] }
    | undefined;
  const verificationFiles = files?.verificationDocuments ?? [];
 
  // 1️⃣ Save uploaded verification documents
  if (verificationFiles.length > 0) {
    property.verificationDocuments = Array.isArray(
      property.verificationDocuments,
    )
      ? property.verificationDocuments
      : [];
 
    for (const file of verificationFiles) {
      const up = await uploadFile({
        buffer: file.buffer,
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
 
 const hasVerified = property.verificationDocuments?.some(
  doc => doc.status === "verified"
);
 
if (!property.completion) {
  property.completion = {
    percent: 0,
    step: 1,
    lastSection: "verification",
  };
}
 
property.completion.lastSection = "verification";
 
if (hasVerified) {
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
 
  await property.save();
  const fresh = await Agricultural.findById(property._id)
    .populate("createdBy", "name email phone")
    .lean();
 
  res.json({
    success: true,
    verified: hasVerified,
    data: fresh,
  });
};
 
 
 
export const getAllAgriculturalDraftsForAdmin = async (req: Request, res: Response) => {
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
      .populate("createdBy", "name email phone")
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
  res: Response
) => {
  try {
    const { id } = req.params;
    const { documentIndex, status } = req.body;
 
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
 
    const updated = await AgriculturalService.verifyDocument(
      id,
      documentIndex,
      status
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
 
 
 
 
 