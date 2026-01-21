import { Request, Response } from "express";
import { ZodError } from "zod";
import CommercialService, { findRelatedCommercial } from "../services/commercialService";
import Commercial from "../models/commercialModel";
import { AuthRequest } from "../middlewares/authMiddleware";

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






export const createCommercialDraft = async (req: AuthRequest, res: Response) => {
  const draft = await Commercial.create({
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



export const updateCommercialBasicStep = async (req: AuthRequest, res: Response) => {
  const updated = await Commercial.findByIdAndUpdate(
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



export const updateCommercialLocationStep = async (req: AuthRequest, res: Response) => {
  
  const updated = await Commercial.findByIdAndUpdate(
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

export const updateCommercialDetailsStep = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    const updated = await CommercialService.update(
      req.params.id,
      {
        ...req.body,

        "completion.percent": 70,
        "completion.step": 4,
        "completion.lastSection": "details",
      },
      files
    );

    if (!updated) {
      return res.status(404).json({ error: "Commercial property not found" });
    }

    res.json({ data: updated });
  } catch (err: any) {
    console.error("updateCommercialDetailsStep:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};



export const finalizeCommercial = async (req: AuthRequest, res: Response) => {
const updated = await Commercial.findByIdAndUpdate(
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


export const getAllCommercialDraftsForAdmin = async (req: Request, res: Response) => {
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
    Commercial.find(filter)
      .populate("createdBy", "name email phone")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Commercial.countDocuments(filter),
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
