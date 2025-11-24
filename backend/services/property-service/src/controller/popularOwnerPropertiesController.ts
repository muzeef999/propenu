// src/controller/ownerPropertyController.ts
import { Request, Response } from "express";
import { OwnerPropertyService } from "../services/popularOwnerPropertieServices";
import { ZodError } from "zod";

/** Helper to parse JSON strings that come from multipart/form-data fields */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return (value as unknown) as T;
  }
}

/** CREATE */
export const createOwnerProperty = async (req: Request, res: Response) => {
  try {
    const body = { ...(req.body || {}) };

    // parse common JSON fields sent as strings in form-data
    body.ownerDetails = parseMaybeJSON(body.ownerDetails);
    body.ownerProperties = parseMaybeJSON(body.ownerProperties);
    body.media = parseMaybeJSON(body.media);
    body.legalCertification = parseMaybeJSON(body.legalCertification);
    body.location = parseMaybeJSON(body.location);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const created = await OwnerPropertyService.create(body, files?.mediaFiles ?? []);
    return res.status(201).json({ data: created });
  } catch (err: any) {
    if (err instanceof ZodError) return res.status(422).json({ errors: err.flatten() });
    console.error("createOwnerProperty:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/** UPDATE */
export const updateOwnerProperty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id parameter" });
    const raw = { ...(req.body || {}) };

    raw.ownerDetails = parseMaybeJSON(raw.ownerDetails);
    raw.ownerProperties = parseMaybeJSON(raw.ownerProperties);
    raw.media = parseMaybeJSON(raw.media);
    raw.legalCertification = parseMaybeJSON(raw.legalCertification);
    raw.location = parseMaybeJSON(raw.location);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const updated = await OwnerPropertyService.update(id, raw, files?.mediaFiles ?? []);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ data: updated });
  } catch (err: any) {
    console.error("updateOwnerProperty:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

/** LIST / FILTER */
export const getOwnerProperties = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const subcategory = typeof req.query.subcategory === "string" ? req.query.subcategory : undefined;
    const city = typeof req.query.city === "string" ? req.query.city : undefined;
    const availabilityStatus = typeof req.query.availabilityStatus === "string" ? req.query.availabilityStatus : undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
    const sortOrder = typeof req.query.sortOrder === "string" && req.query.sortOrder === "asc" ? "asc" : "desc";

    // geo params
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : undefined;

    const result = await OwnerPropertyService.list({
      page,
      limit,
      ...(q !== undefined && { q }),
      ...(ownerId !== undefined && { ownerId }),
      ...(category !== undefined && { category }),
      ...(subcategory !== undefined && { subcategory }),
      ...(city !== undefined && { city }),
      ...(availabilityStatus !== undefined && { availabilityStatus }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(sortBy !== undefined && { sortBy }),
      sortOrder,
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      ...(radiusKm !== undefined && { radiusKm }),
    });

    return res.json(result);
  } catch (err: any) {
    console.error("getOwnerProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

/** GET by ID */
export const getOwnerPropertyById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id parameter" });
    const doc = await OwnerPropertyService.getById(id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getOwnerPropertyById:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
/** GET by slug */
export const getOwnerPropertyBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug parameter" });
    const doc = await OwnerPropertyService.getBySlug(slug);
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getOwnerPropertyBySlug:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
/** DELETE */
export const deleteOwnerProperty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id parameter" });
    const deleted = await OwnerPropertyService.remove(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteOwnerProperty:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
  


/** GET properties for a specific owner user id */
export const getPropertiesByOwnerUserId = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId parameter" });
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await OwnerPropertyService.getPropertiesByOwnerUserId(userId, page, limit);
    return res.json(result);
  } catch (err: any) {
    console.error("getPropertiesByOwnerUserId:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
