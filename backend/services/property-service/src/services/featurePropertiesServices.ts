// src/services/featurePropertiesServices.ts
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3"; // your AWS.S3 v2 client
import FeaturedProject from "../models/featurePropertiesModel";
import { CreateFeaturePropertyDTO, UpdateFeaturePropertyDTO } from "../zod/validation";
import dotenv from "dotenv";

dotenv.config();

/**
 * Utility types for Multer files
 */
type MulterFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

/* --------------------
   Helpers
   --------------------*/

/** slugify helper */
function slugifyTitle(title: string) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** generate unique slug (append -1, -2, ...) */
async function generateUniqueSlug(desiredTitleOrSlug: string, excludeId?: string) {
  const slug = slugifyTitle(desiredTitleOrSlug);

  // Check if another document already uses this slug
  const existing = await FeaturedProject.findOne({ slug }).select("_id").lean();

  if (existing) {
    // If this slug belongs to the SAME document (during update), allow it
    if (excludeId && existing._id.toString() === excludeId) {
      return slug;
    }

    // Otherwise → slug already used → STOP auto-increment → throw error
    const err: any = new Error("Slug already in use");
    err.code = "SLUG_TAKEN";
    throw err;
  }

  return slug; // available
}


/** compute price range from bhkSummary */
function computePriceRangeFromBhk(bhkSummary?: any[]) {
  if (!Array.isArray(bhkSummary) || bhkSummary.length === 0) return { priceFrom: undefined, priceTo: undefined };
  const mins = bhkSummary
    .map((b) => (typeof b?.minPrice === "number" ? b.minPrice : undefined))
    .filter((v) => typeof v === "number") as number[];
  const maxs = bhkSummary
    .map((b) => (typeof b?.maxPrice === "number" ? b.maxPrice : undefined))
    .filter((v) => typeof v === "number") as number[];
  const priceFrom = mins.length ? Math.min(...mins) : undefined;
  const priceTo = maxs.length ? Math.max(...maxs) : undefined;
  return { priceFrom, priceTo };
}

/**
 * Local upload helper (uses your s3 client directly)
 * Builds key as: <folder>/<propertyId>/<timestamp>-<uuid>.<ext>
 */
async function uploadBufferToS3Local(opts: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  propertyId: string;
  folder?: string;
}): Promise<{ key: string; url: string }> {
  const { buffer, originalname, mimetype, propertyId, folder = "featured" } = opts;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error("Missing S3 bucket or region env var");

  const ext = originalname.includes(".") ? originalname.split(".").pop() : "";
  const uniqueName = `${Date.now()}-${randomUUID()}${ext ? "." + ext : ""}`;
  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const key = `${safeFolder}/${propertyId}/${uniqueName}`;

  await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
    .promise();

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
  return { key, url };
}

/* --------------------
   Service
   --------------------*/

export const FeaturePropertyService = {
  /**
   * Create feature property with file uploads (multer files)
   */
  async createFeatureProperty(payload: CreateFeaturePropertyDTO, files?: MulterFiles) {
    // 1) slug
    const slugSource = (payload.slug && String(payload.slug).trim()) || payload.title;
    const slug = await generateUniqueSlug(slugSource);

    // 2) compute prices
    const { priceFrom, priceTo } = computePriceRangeFromBhk(payload.bhkSummary as any[] | undefined);

    // 3) prepare base create payload
    const toCreate: any = {
      ...payload,
      slug,
      priceFrom,
      priceTo,
    };

    // create a preliminary doc instance to get _id for S3 key naming (no DB write yet)
    const preliminary = new FeaturedProject(toCreate);
    const propId = preliminary._id!.toString();

    // HERO IMAGE (single)
    const heroFiles = files?.heroImage;
    if (heroFiles && heroFiles.length > 0) {
      const f: Express.Multer.File = heroFiles[0]!;
      const up = await uploadBufferToS3Local({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
        propertyId: propId,
        folder: "Builder_hero", // folder name you asked for
      });
      toCreate.heroImage = up.url;
    }

    // HERO VIDEO (single)
    const heroVideoFiles = files?.heroVideo;
    if (heroVideoFiles && heroVideoFiles.length > 0) {
      const v: Express.Multer.File = heroVideoFiles[0]!;
      const up = await uploadBufferToS3Local({
        buffer: v.buffer,
        originalname: v.originalname,
        mimetype: v.mimetype,
        propertyId: propId,
        folder: "video",
      });
      toCreate.heroVideo = up.url;
    }

    // GALLERY FILES (multiple)
    const galleryFiles = files?.galleryFiles ?? [];
    if (galleryFiles.length > 0) {
      toCreate.gallerySummary = toCreate.gallerySummary || [];
      for (const f of galleryFiles) {
        // f is typed as Express.Multer.File
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "gallery",
        });
        toCreate.gallerySummary.push({
          title: f.originalname,
          url: up.url,
          category: "image",
          order: (toCreate.gallerySummary.length || 0) + 1,
        });
      }
    }

    // finally create document in DB
    const created = await FeaturedProject.create(toCreate);
    return created;
  },

  /**
   * Update feature property with optional file uploads
   */
  async updateFeatureProperty(id: string, payload: UpdateFeaturePropertyDTO, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await FeaturedProject.findById(id);
    if (!existing) return null;

    // slug changes
    if ((payload.slug && payload.slug !== existing.slug) || (payload.title && payload.title !== existing.title)) {
      const slugSource = (payload.slug && String(payload.slug).trim()) || (payload.title as string);
      existing.slug = await generateUniqueSlug(slugSource, id);
    }

    // compute price range if provided
    if ((payload as any).bhkSummary) {
      const { priceFrom, priceTo } = computePriceRangeFromBhk((payload as any).bhkSummary);
      if (priceFrom !== undefined) existing.priceFrom = priceFrom;
      if (priceTo !== undefined) existing.priceTo = priceTo;
    }

    // apply payload fields
    Object.keys(payload).forEach((k) => {
      (existing as any)[k] = (payload as any)[k];
    });

    const propId = existing._id!.toString();

    // replace hero image
    const heroFiles = files?.heroImage;
    if (heroFiles && heroFiles.length > 0) {
      const f: Express.Multer.File = heroFiles[0]!;
      const up = await uploadBufferToS3Local({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
        propertyId: propId,
        folder: "hero",
      });
      existing.heroImage = up.url;
      // TODO: delete old object from S3 if you stored its key
    }

    // replace hero video
    const heroVideoFiles = files?.heroVideo;
    if (heroVideoFiles && heroVideoFiles.length > 0) {
      const v: Express.Multer.File = heroVideoFiles[0]!;
      const up = await uploadBufferToS3Local({
        buffer: v.buffer,
        originalname: v.originalname,
        mimetype: v.mimetype,
        propertyId: propId,
        folder: "video",
      });
      existing.heroVideo = up.url;
    }

    // append gallery files
    const galleryFiles = files?.galleryFiles ?? [];
    if (galleryFiles.length > 0) {
      existing.gallerySummary = existing.gallerySummary || [];
      for (const f of galleryFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "gallery",
        });
        existing.gallerySummary.push({
          title: f.originalname,
          url: up.url,
          category: "image",
          order: (existing.gallerySummary.length || 0) + 1,
        } as any);
      }
    }

    await existing.save();
    return existing;
  },

  async getFeatureById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    return await FeaturedProject.findById(id).lean();
  },

  async getFeatureBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    return await FeaturedProject.findOne({ slug }).lean();
  },

  async getAllFeatures(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.status) filter.status = options.status;
    const sort: any = {};
    if (options?.sortBy) sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const [items, total] = await Promise.all([
      FeaturedProject.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      FeaturedProject.countDocuments(filter).exec(),
    ]);
    return { items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  },

  async deleteFeatureProperty(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const deleted = await FeaturedProject.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    await FeaturedProject.findByIdAndUpdate(id, { $inc: { "meta.views": 1 } }).exec();
  },
};
