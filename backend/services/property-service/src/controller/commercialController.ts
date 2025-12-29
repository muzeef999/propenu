import { Request, Response } from "express";
import { ZodError } from "zod";
import CommercialService, { findRelatedCommercial } from "../services/commercialService";
// import { CommercialCreateDTO, CommercialUpdateDTO } from "../zod/commercialZod"; // if you have zod

function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return (value as unknown) as T;
  }
} 

export const createCommercial = async (req: Request, res: Response) => {
  try {
    const raw = { ...(req.body || {}) };

    const parsed = {
      ...raw,
      location: parseMaybeJSON(raw.location),
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      leaseDocuments: parseMaybeJSON(raw.leaseDocuments),
      tenantInfo: parseMaybeJSON(raw.tenantInfo),
      buildingManagement: parseMaybeJSON(raw.buildingManagement),
    };

    // If you have a Zod schema, validate here:
    // const payload = CommercialCreateSchema.parse(parsed);

    const payload = parsed; // fallback if no zod
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const created = await CommercialService.create(payload as any, files);
    const fresh = created?._id ? await CommercialService.getById(String(created._id)) : created;

    return res.status(201).json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) return res.status(422).json({ errors: err.flatten() });
    if (err && err.code === "SLUG_TAKEN") return res.status(409).json({ error: "Slug already in use" });
    console.error("createCommercial:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getAllCommercial = async (req: Request, res: Response) => {
  try {
    const options: any = {};
    const { page, limit, q, status, sortBy, sortOrder, city, minPrice, maxPrice } = req.query;
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    if (typeof sortOrder === "string") options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    if (typeof city === "string") options.city = city;
    if (typeof minPrice === "string") options.minPrice = Number(minPrice);
    if (typeof maxPrice === "string") options.maxPrice = Number(maxPrice);

    const result = await CommercialService.list(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllCommercial:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getCommercialBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    // 1️⃣ Fetch property
    const property = await CommercialService.getBySlug(slug);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // 2️⃣ Increment views (fire-and-forget)
    const id = (property as any)._id?.toString?.();
    if (id) {
      CommercialService.incrementViews(id).catch((e: any) =>
        console.error("incrementViews error:", e)
      );
    }

    // 3️⃣ Find related commercial properties
    const relatedProjects = await findRelatedCommercial(property);

    // 4️⃣ Response
    return res.json({
      data: property,
      relatedProjects,
    });
  } catch (err: any) {
    console.error("getCommercialBySlug:", err);
    return res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};


export const getCommercialDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const doc = await CommercialService.getById(id);
    if (!doc) return res.status(404).json({ error: "Property not found" });

    CommercialService.incrementViews(id).catch((e) => console.error("incrementViews error:", e));

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getCommercialDetail:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const editCommercial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      location: parseMaybeJSON(raw.location),
      gallery: parseMaybeJSON(raw.gallery),
      documents: parseMaybeJSON(raw.documents),
      leaseDocuments: parseMaybeJSON(raw.leaseDocuments),
      tenantInfo: parseMaybeJSON(raw.tenantInfo),
      buildingManagement: parseMaybeJSON(raw.buildingManagement),
    };

    // const payload = CommercialUpdateSchema.parse(parsed);
    const payload = parsed;
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const updated = await CommercialService.update(id, payload as any, files);
    if (!updated) return res.status(404).json({ error: "Property not found" });

    const fresh = await CommercialService.getById(id);
    return res.json({ data: fresh });
  } catch (err: any) {
    if (err instanceof ZodError) return res.status(422).json({ errors: err.flatten() });
    if (err && err.code === "SLUG_TAKEN") return res.status(409).json({ error: "Slug already in use" });
    console.error("editCommercial:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const deleteCommercial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const deleted = await CommercialService.delete(id);
    if (!deleted) return res.status(404).json({ error: "Property not found" });

    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteCommercial:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};
