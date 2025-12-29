// src/controller/agriculturalController.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import { AgriculturalCreateSchema, AgriculturalUpdateSchema } from "../zod/agriculturalZod";
import AgriculturalService, { findRelatedAgriculture } from "../services/agriculturalServices";
import { findRelatedResidential } from "../services/residentialServices";

/** safety: parse JSON-like values that may be strings (multipart/form-data) */
function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  } 
}

/** CREATE */
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
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const created = await AgriculturalService.create(payload as any, files);
    const fresh = created?._id ? await AgriculturalService.getById(String(created._id)) : created;

    return res.status(201).json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ message: "Validation failed", issues: err.flatten().fieldErrors });
    }
    if (err && err.code === "SLUG_TAKEN") {
      return res.status(409).json({ error: "Slug already in use" });
    }
    console.error("createAgricultural:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
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
    if (typeof sortOrder === "string") options.sortOrder = sortOrder === "asc" ? "asc" : "desc";

    const result = await AgriculturalService.list(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllAgricultural:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
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
        console.error("incrementViews:", e)
      );
    }

    const relatedProjects = await findRelatedAgriculture(property);

    return res.json({
      data: property,
      relatedProjects,
    });
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

    AgriculturalService.incrementViews(id).catch((e) => console.error("incrementViews:", e));
    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getAgriculturalDetail:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
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
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const updated = await AgriculturalService.update(id, payload as any, files);
    if (!updated) return res.status(404).json({ error: "Not found" });

    const fresh = await AgriculturalService.getById(id);
    return res.json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ message: "Validation failed", issues: err.flatten().fieldErrors });
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
    console.error("deleteAgricultural:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};
