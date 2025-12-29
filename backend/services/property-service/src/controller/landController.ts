import { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateLandSchema, UpdateLandSchema } from "../zod/landZod";
import LandService, { findRelatedLand } from "../services/landService";

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
        raw.encumbranceCertificateFile
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
    return res.json(result);
  } catch (err: any) {
    console.error("getAllLands:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
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
        console.error("incrementViews error:", e)
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
      console.error("incrementViews error:", e)
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
        raw.encumbranceCertificateFile
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
