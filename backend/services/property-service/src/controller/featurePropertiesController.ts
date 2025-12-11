import { Request, Response } from "express";
import { CreateFeaturePropertyDTO, UpdateFeaturePropertyDTO, CreateFeaturePropertySchema, UpdateFeaturePropertySchema } from "../zod/validation";
import { FeaturePropertyService } from "../services/featurePropertiesServices";
import { ZodError } from "zod";


function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try { 
    return JSON.parse(value) as T;
  } catch {
    // not JSON — return as string
    return (value as unknown) as T;
  }
}

export const createFeatureProperties = async (req: Request, res: Response) => {
  try {
    // req.body fields (multipart) come as strings — parse arrays/objects
    const raw = { ...(req.body || {}) };

    // parse known complex fields that clients will send as JSON strings:
    const parsed = {
      ...raw,
      bhkSummary: parseMaybeJSON(raw.bhkSummary),
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallerySummary: parseMaybeJSON(raw.gallerySummary),
      sqftRange: parseMaybeJSON(raw.sqftRange),
      leads: parseMaybeJSON(raw.leads),
      // add others as needed
    };

    // Validate with Zod (throws if invalid)
    const payload = CreateFeaturePropertySchema.parse(parsed) as CreateFeaturePropertyDTO;

    // files: multer puts them in req.files
    // heroImage: single file 'heroImage', galleryFiles: array
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const created = await FeaturePropertyService.createFeatureProperty(payload, files);
    return res.status(201).json({ data: created });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    console.error("createFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getAllFeatureProperties = async (req: Request, res: Response) => {
  try {
    const { page, limit, q, status, sortBy, sortOrder } = req.query;
    const options: any = {};
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    const result = await FeaturePropertyService.getAllFeatures(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getAllHighlightProjects = async (req: Request, res: Response) => {
  try {
    const { page, limit, q, status, sortBy, sortOrder } = req.query;
    const options: any = {};
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    const result = await FeaturePropertyService.getAllHighlightProjects(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getCityHighlightProperties = async(req: Request, res: Response) => {
  try {
  const city = req.query.city as string;

    if (!city) {
      return res.status(400).json({ error: "city query param is required" });
    }

    const result = await FeaturePropertyService.getHighlightByCity(city);
    return res.json(result);
  
  }catch(err:any) {
     console.error("getAllFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}


export const getCityFeatureProperties = async(req: Request, res: Response) => {
  try {
  const city = req.query.city as string;

    if (!city) {
      return res.status(400).json({ error: "city query param is required" });
    }

    const result = await FeaturePropertyService.getFeaturesByCity(city);
    return res.json(result);
  
  }catch(err:any) {
     console.error("getAllFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}



export const getSearchFeatureProperties = async(req: Request, res: Response) => {
  try {

  }catch(err:any) {
     console.error("getAllFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

export const getFeatureBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const doc = await FeaturePropertyService.getFeatureBySlug(slug);
    if (!doc) return res.status(404).json({ error: "Property not found" });

    // increment view count async
    FeaturePropertyService.incrementViews((doc as any)._id.toString()).catch((e) =>
      console.error("incrementViews error:", e)
    );

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getFeatureBySlug:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getIndetailFeatureProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });
    const doc = await FeaturePropertyService.getFeatureById(id);
    if (!doc) return res.status(404).json({ error: "Feature property not found" });
    FeaturePropertyService.incrementViews(id).catch((e) => console.error("incrementViews error:", e));
    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getIndetailFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const editFeatureProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      bhkSummary: parseMaybeJSON(raw.bhkSummary),
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallerySummary: parseMaybeJSON(raw.gallerySummary),
      sqftRange: parseMaybeJSON(raw.sqftRange),
      leads: parseMaybeJSON(raw.leads),
    };

    const payload = UpdateFeaturePropertySchema.parse(parsed) as UpdateFeaturePropertyDTO;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const updated = await FeaturePropertyService.updateFeatureProperty(id, payload, files);
    if (!updated) return res.status(404).json({ error: "Feature property not found" });
    return res.json({ data: updated });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    console.error("editFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const deleteFeatureProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });
    const deleted = await FeaturePropertyService.deleteFeatureProperty(id);
    if (!deleted) return res.status(404).json({ error: "Feature property not found" });
    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};
