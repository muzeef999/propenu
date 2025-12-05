// src/controllers/residential.controller.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import { ResidentialCreateSchema, ResidentialUpdateSchema } from "../zod/residentialZod";
import ResidentialPropertyService from "../services/residentialServices";

/** Helper: parse values that might be JSON strings (multipart sends arrays/objects as strings). */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    // not JSON — return as-is
    return (value as unknown) as T;
  }
}

/**
 * CREATE
 */
export const createResidential = async (req: Request, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };

    // parse only fields that exist in your model (no images, no bhkSummary)
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

    // Validate payload (throws ZodError)
    const payload = ResidentialCreateSchema.parse(parsed);

    // Multer files map (field -> Express.Multer.File[]), we expect galleryFiles and documents
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    // call service: create(...) returns created doc
    const created = await ResidentialPropertyService.create(payload as any, files);

    // return created resource (use lean getter if you prefer)
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

/**
 * LIST
 */
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

/**
 * GET BY SLUG
 */
export const getResidentialBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const doc = await ResidentialPropertyService.getBySlug(slug);
    if (!doc) return res.status(404).json({ error: "Property not found" });

    // increment views (non-blocking)
    (async () => {
      try {
        const id = (doc as any)._id?.toString?.();
        if (id) await ResidentialPropertyService.incrementViews(id);
      } catch (e) {
        console.error("incrementViews error:", e);
      }
    })();

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getResidentialBySlug:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/**
 * GET DETAIL BY ID
 */
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

/**
 * UPDATE
 */
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

/**
 * DELETE
 */
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
