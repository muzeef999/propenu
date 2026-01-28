// src/controllers/residential.controller.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import { ResidentialCreateSchema, ResidentialUpdateSchema } from "../zod/residentialZod";
import ResidentialPropertyService, { findRelatedResidential } from "../services/residentialServices";
import { AuthRequest } from "../middlewares/authMiddleware";
import Residential from "../models/residentialModel";

/** Helper: parse values that might be JSON strings (multipart sends arrays/objects as strings). */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return (value as unknown) as T;
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
      documents: parseMaybeJSON(raw.documents),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      legalChecks: parseMaybeJSON(raw.legalChecks),
      parkingDetails: parseMaybeJSON(raw.parkingDetails),
      security: parseMaybeJSON(raw.security),
      fireSafetyDetails: parseMaybeJSON(raw.fireSafetyDetails),
      greenCertification: parseMaybeJSON(raw.greenCertification),
      smartHomeFeatures: parseMaybeJSON(raw.smartHomeFeatures),
      relatedProjects: parseMaybeJSON(raw.relatedProjects),
    };

    const payload = ResidentialCreateSchema.parse(parsed);

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;


    const created = await ResidentialPropertyService.create({ ...payload, createdBy: req.user!.id,    status: "active",},files);


    const fresh = created?._id ? await ResidentialPropertyService.getById(String(created._id)) : created;

    return res.status(201).json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("createResidential:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
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
    if (typeof sortOrder === "string") options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    if (typeof city === "string") options.city = city;
    if (typeof minPrice === "string") options.minPrice = Number(minPrice);
    if (typeof maxPrice === "string") options.maxPrice = Number(maxPrice);
    if (typeof bedrooms === "string") options.bedrooms = Number(bedrooms);
    if (typeof bathrooms === "string") options.bathrooms = Number(bathrooms);
    if (typeof near === "string") options.near = near;
    if (typeof maxDistance === "string") options.maxDistance = Number(maxDistance);

    const result = await ResidentialPropertyService.list(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllResidential:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
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
        console.error("incrementViews error:", e)
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
    ResidentialPropertyService.incrementViews(id).catch((e: any) => console.error("incrementViews error:", e));

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
      documents: parseMaybeJSON(raw.documents),
      leads: parseMaybeJSON(raw.leads),
      location: parseMaybeJSON(raw.location),
      legalChecks: parseMaybeJSON(raw.legalChecks),
      parkingDetails: parseMaybeJSON(raw.parkingDetails),
      security: parseMaybeJSON(raw.security),
      fireSafetyDetails: parseMaybeJSON(raw.fireSafetyDetails),
      greenCertification: parseMaybeJSON(raw.greenCertification),
      smartHomeFeatures: parseMaybeJSON(raw.smartHomeFeatures),
      relatedProjects: parseMaybeJSON(raw.relatedProjects),
    };

    const payload = ResidentialUpdateSchema.parse(parsed);

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const updated = await ResidentialPropertyService.update(id, payload as any, files);
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


export const createResidentialDraft = async (req: AuthRequest, res: Response) => {
  const draft = await Residential.create({
    createdBy: req.user!.id,
    status: "draft",
    completion: {
      percent: 0,
      step: 1,
      lastSection: "basic",
    },
  });

  res.status(201).json({ data: draft });
};


export const updateBasicStep = async (req: AuthRequest, res: Response) => {
  const updated = await Residential.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      "completion.percent": 25,
      "completion.step": 2,
      "completion.lastSection": "basic",
    },
    { new: true }
  );
  res.json({ data: updated });
};

export const updateLocationStep = async (req: AuthRequest, res: Response) => {
  const updated = await Residential.findByIdAndUpdate(
    req.params.id,
    {
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      locality: req.body.locality,
      location: req.body.location,

      "completion.percent": 45,
      "completion.step": 3,
      "completion.lastSection": "location",
    },
    { new: true }
  );

  res.json({ data: updated });
};

export const updateDetailsStep = async (req: AuthRequest, res: Response) => {
  try {

    console.log("====== UPDATE DETAILS STEP HIT ======");
    console.log("REQ.FILES:", req.files);
    console.log("REQ.BODY.GALLERY:", req.body.gallery);

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    
    console.log("FILES RECEIVED:", files?.galleryFiles?.map(f => f.originalname));

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
      files
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
  const updated = await Residential.findByIdAndUpdate(
    req.params.id,
    {
      legalChecks: req.body.legalChecks,

      status: "active",
      isPublished: true,

      "completion.percent": 100,
      "completion.step": 5,
      "completion.lastSection": "verification",
    },
    { new: true }
  );

  res.json({ data: updated });
};

export const getAllResidentialDraftsForAdmin = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", q, userId, city, status = "draft" } = req.query;

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
