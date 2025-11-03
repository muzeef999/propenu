import { Request, Response } from "express";
import { CreateFeaturePropertyDTO, UpdateFeaturePropertyDTO } from "../zod/validation";
import { FeaturePropertyService } from "../services/featurePropertiesServices";

export const createFeatureProperties = async (req: Request, res: Response) => {
  try {
    const payload = req.body as CreateFeaturePropertyDTO;
    const created = await FeaturePropertyService.createFeatureProperty(payload);
    return res.status(201).json({ data: created });
  } catch (err: any) {
    console.error("createFeatureProperties:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};


export const getAllFeatureProperties = async (req: Request, res: Response) => {
  try {
    const { page, limit, q, status, sortBy, sortOrder } = req.query;

    const options: {
      page?: number;
      limit?: number;
      q?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {};

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

export const getIndetailFeatureProperties = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing property ID" });
    }

    const doc = await FeaturePropertyService.getFeatureById(id);
    if (!doc) return res.status(404).json({ error: "Feature property not found" });

    // increment view count asynchronously (non-blocking)
    FeaturePropertyService.incrementViews(id).catch((e) =>
      console.error("incrementViews error:", e)
    );

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getIndetailFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const editFeatureProperties = async (req: Request, res: Response) => {
  try {
       const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing property ID" });
    }

    const payload = req.body as UpdateFeaturePropertyDTO;

    const updated = await FeaturePropertyService.updateFeatureProperty(id, payload);
    if (!updated) return res.status(404).json({ error: "Feature property not found" });
    return res.json({ data: updated });
  } catch (err: any) {
    console.error("editFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const deleteFeatureProperties = async (req: Request, res: Response) => {
  try {
   
       const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing property ID" });
    }

    const deleted = await FeaturePropertyService.deleteFeatureProperty(id);

    if (!deleted) return res.status(404).json({ error: "Feature property not found" });
    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};
