import { Request, Response } from "express";
import {
  CreateFeaturePropertyDTO,
  UpdateFeaturePropertyDTO,
  CreateFeaturePropertySchema,
  UpdateFeaturePropertySchema,
} from "../zod/validation";
import { FeaturePropertyService } from "../services/featurePropertiesServices";
import { ZodError } from "zod";
import { AuthRequest } from "../middlewares/authMiddleware";
import FeatureProperty from "../models/featurePropertiesModel";
import { deleteS3ObjectIfExists } from "../utils/s3Helpers";
import mongoose from "mongoose";
import BuilderMember from "../models/builderMemberModel";

const getBuilderProjectScope = async (req: AuthRequest) => {
  if (!req.user?.id) {
    throw new Error("Unauthorized");
  }

  if (req.user.roleName !== "builder_staff") {
    return {
      createdBy: req.user.id,
      projectIds: null as string[] | null,
    };
  }

  const member = await BuilderMember.findOne({
    userId: req.user.id,
    isActive: true,
  })
    .select("builderId projectIds")
    .lean();

  if (!member) {
    return {
      createdBy: req.user.id,
      projectIds: [],
    };
  }

  return {
    createdBy: String((member as any).builderId),
    projectIds: ((member as any).projectIds ?? []).map(String),
  };
};

function parseMaybeJSON<T = any>(value: any): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    // not JSON — return as string
    return value as unknown as T;
  }
}

export const createFeatureProperties = async (req: Request, res: Response) => {
  try {
    // req.body fields (multipart) come as strings — parse arrays/objects
    const raw = { ...(req.body || {}) };

    // parse known complex fields that clients will send as JSON strings:
    const parsed = {
      ...raw,
      projectSummary: parseMaybeJSON(raw.projectSummary ?? raw.bhkSummary),
      bhkSummary: parseMaybeJSON(raw.projectSummary ?? raw.bhkSummary),
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallerySummary: parseMaybeJSON(raw.gallerySummary),
      sqftRange: parseMaybeJSON(raw.sqftRange),
      area: parseMaybeJSON(raw.area),
      leads: parseMaybeJSON(raw.leads),
      youtubeVideos: parseMaybeJSON(raw.youtubeVideos), // ⭐ ADD

      // add others as needed
    };

    // Validate with Zod (throws if invalid)
    const payload = CreateFeaturePropertySchema.parse(
      parsed,
    ) as CreateFeaturePropertyDTO;

    const authUser = (req as AuthRequest).user;

    const roleName = authUser?.roleName;

    if (roleName === "sales_agent") {
      payload.status = "pending";

      payload.approvalStatus = "pending";
    } else {
      payload.status = "active";

      payload.approvalStatus = "approved";

      payload.approvedBy = authUser?.id;

      payload.approvedAt = new Date();
    }

    // files: multer puts them in req.files
    // heroImage: single file 'heroImage', galleryFiles: array
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const created = await FeaturePropertyService.createFeatureProperty(
      payload,
      files,
      (req as AuthRequest).user,
    );

    return res.status(201).json({ data: created });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(422).json({ errors: err.flatten() });
    }
    console.error("createFeatureProperties:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getMyHightlightProjectsController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const scope = await getBuilderProjectScope(req);
    const projects =
      await FeaturePropertyService.getMyHightlightProjects(
        scope.createdBy,
        scope.projectIds,
      );
    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyFeaturedProjectsController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const scope = await getBuilderProjectScope(req);
    const projects = await FeaturePropertyService.getMyFeaturedProjects(
      scope.createdBy,
      scope.projectIds,
    );
    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllFeatureProperties = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      q,
      status,
      sortBy,
      sortOrder,
      type,
      city,
      state,
      locality,
      createdBy,
      promotionStatus,
    } = req.query;
    const options: any = {};
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    options.sortOrder = sortOrder === "asc" ? "asc" : "desc";

    if (typeof type === "string") options.type = type;
    if (typeof city === "string") options.city = city;
    if (typeof state === "string") options.state = state;
    if (typeof locality === "string") options.locality = locality;
    if (typeof promotionStatus === "string") {
      options.promotionStatus = promotionStatus;
    }
    if (typeof createdBy === "string") {
      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({ error: "Invalid createdBy" });
      }
      options.createdBy = createdBy;
    }

    const result = await FeaturePropertyService.getAllFeatures(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getAllHighlightProjects = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      q,
      status,
      sortBy,
      sortOrder,
      type,
      city,
      state,
      locality,
    } = req.query;
    const options: any = {};
    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof status === "string") options.status = status;
    if (typeof sortBy === "string") options.sortBy = sortBy;
    options.sortOrder = sortOrder === "asc" ? "asc" : "desc";
    const result =
      await FeaturePropertyService.getAllHighlightProjects(options);
    return res.json(result);
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getHighlightProjectsByLocation = async (
  req: Request,
  res: Response,
) => {
  try {
    const { state, city, locality } = req.query as {
      state?: string;
      city?: string;
      locality?: string;
    };

    if (!state && !city && !locality) {
      return res.status(400).json({
        error: "At least one of state, city, or locality is required",
      });
    }

    const result = await FeaturePropertyService.getHighlightByLocation({
      ...(state && { state }),
      ...(city && { city }),
      ...(locality && { locality }),
    });

    return res.json(result);
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getCityFeatureProperties = async (req: Request, res: Response) => {
  try {
    let { locality, city, state } = req.query as {
      locality?: string;
      city?: string;
      state?: string;
    };

    if (!locality && !city && !state) {
      return res.status(400).json({
        error: "At least one of locality, city, or state is required",
      });
    }

    const clean = (v?: string) => v?.replace(/^['"]|['"]$/g, "").trim();

    locality = clean(locality);
    city = clean(city);
    state = clean(state);

    const result = await FeaturePropertyService.getFeaturesByCity({
      ...(locality && { locality }),
      ...(city && { city }),
      ...(state && { state }),
    });
    return res.json(result);
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getSearchFeatureProperties = async (
  req: Request,
  res: Response,
) => {
  try {
  } catch (err: any) {
    console.error("getAllFeatureProperties:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getFeatureBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const doc = await FeaturePropertyService.getFeatureBySlug(slug);
    if (!doc) return res.status(404).json({ error: "Property not found" });

    // increment view count async
    FeaturePropertyService.incrementViews((doc as any)._id.toString()).catch(
      (e) => console.error("incrementViews error:", e),
    );

    return res.json({ data: doc });
  } catch (err: any) {
    console.error("getFeatureBySlug:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const getIndetailFeatureProperties = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing property ID" });
    const doc = await FeaturePropertyService.getFeatureById(id);
    if (!doc)
      return res.status(404).json({ error: "Feature property not found" });
    FeaturePropertyService.incrementViews(id).catch((e) =>
      console.error("incrementViews error:", e),
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
    if (!id) return res.status(400).json({ error: "Missing property ID" });

    const raw = { ...(req.body || {}) };
    const parsed = {
      ...raw,
      projectSummary: parseMaybeJSON(raw.projectSummary ?? raw.bhkSummary),
      bhkSummary: parseMaybeJSON(raw.projectSummary ?? raw.bhkSummary),
      specifications: parseMaybeJSON(raw.specifications),
      amenities: parseMaybeJSON(raw.amenities),
      nearbyPlaces: parseMaybeJSON(raw.nearbyPlaces),
      gallerySummary: parseMaybeJSON(raw.gallerySummary),
      sqftRange: parseMaybeJSON(raw.sqftRange),
      area: parseMaybeJSON(raw.area),
      leads: parseMaybeJSON(raw.leads),
      youtubeVideos: parseMaybeJSON(raw.youtubeVideos), // ⭐ ADD
    };

    const payload = UpdateFeaturePropertySchema.parse(
      parsed,
    ) as UpdateFeaturePropertyDTO;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const updated = await FeaturePropertyService.updateFeatureProperty(
      id,
      payload,
      files,
      (req as AuthRequest).user,
    );
    if (!updated)
      return res.status(404).json({ error: "Feature property not found" });
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
    if (!deleted)
      return res.status(404).json({ error: "Feature property not found" });
    return res.json({ data: deleted, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("deleteFeatureProperties:", err);
    return res.status(400).json({ error: err.message || "Bad request" });
  }
};

export const deleteFeatureGalleryImage = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id, imageIndex } = req.params;

    if (!id || imageIndex === undefined) {
      return res.status(400).json({ message: "Missing params" });
    }

    const property = await FeatureProperty.findById(id);

    if (!property) {
      return res.status(404).json({ message: "Feature property not found" });
    }

    const index = Number(imageIndex);

    if (!property.gallerySummary?.[index]) {
      return res.status(404).json({ message: "Image not found" });
    }

    const image = property.gallerySummary[index];

    if (image.key) {
      await deleteS3ObjectIfExists(image.key);
    }

    property.gallerySummary.splice(index, 1);

    await property.save();

    return res.json({ success: true, data: property.gallerySummary });
  } catch (err: any) {
    console.error("deleteFeatureGalleryImage:", err);
    return res.status(500).json({ message: err.message });
  }
};
