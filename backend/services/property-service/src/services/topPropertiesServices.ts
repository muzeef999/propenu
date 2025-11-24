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

/** generate unique slug (throws if taken) */
async function generateUniqueSlug(desiredTitleOrSlug: string, excludeId?: string) {
  const slug = slugifyTitle(desiredTitleOrSlug);

  const existing = await FeaturedProject.findOne({ slug }).select("_id").lean();

  if (existing) {
    if (excludeId && existing._id.toString() === excludeId) {
      return slug;
    }
    const err: any = new Error("Slug already in use");
    err.code = "SLUG_TAKEN";
    throw err;
  }

  return slug;
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

/**
 * Delete S3 object if key exists. Logs errors but doesn't throw so update/create flows continue.
 */
async function deleteS3ObjectIfExists(key?: string) {
  if (!key) return;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.warn("deleteS3ObjectIfExists: AWS_S3_BUCKET not configured");
    return;
  }
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch (e: any) {
    console.error("deleteS3ObjectIfExists failed for key:", key, e?.message || e);
    // don't rethrow — allow operation to continue
  }
}

/**
 * Process incoming bhkSummary together with uploaded bhkPlanFiles.
 * Behavior:
 *  - planRemove: delete old S3 key and set plan=null
 *  - new file matched (index or planFileName): upload, delete old key, set plan object
 *  - planUrl provided: set external URL (optionally delete old S3)
 *  - otherwise preserve existing plan if present
 *
 * Note: incoming array is treated as "desired final array". If you want patch semantics,
 * merge incoming into existing first (see mergeBhkSummary helper used in update flow).
 */
async function processBhkPlanUpdates(opts: {
  bhkSummaryExisting?: any[];
  bhkSummaryIncoming?: any[];
  bhkPlanFiles?: Express.Multer.File[];
  propertyId: string;
  deleteOldS3OnExternalUrl?: boolean;
}) {
  const {
    bhkSummaryExisting = [],
    bhkSummaryIncoming = [],
    bhkPlanFiles = [],
    propertyId,
    deleteOldS3OnExternalUrl = false,
  } = opts;

  const filesByName = new Map<string, Express.Multer.File>();
  for (const f of bhkPlanFiles) filesByName.set(f.originalname, f);

  for (let i = 0; i < bhkSummaryIncoming.length; i++) {
    const incomingEntry = bhkSummaryIncoming[i] as any;
    const existingEntry = bhkSummaryExisting[i] as any;

    // planRemove requested
    if (incomingEntry.planRemove) {
      if (existingEntry?.plan?.key) {
        await deleteS3ObjectIfExists(existingEntry.plan.key);
      }
      incomingEntry.plan = null;
      continue;
    }

    // try index match first
    let matchedFile: Express.Multer.File | undefined = bhkPlanFiles[i];

    // fallback: planFileName match
    if (!matchedFile && incomingEntry.planFileName && filesByName.has(incomingEntry.planFileName)) {
      matchedFile = filesByName.get(incomingEntry.planFileName);
    }

    if (matchedFile) {
      // upload new file
      const up = await uploadBufferToS3Local({
        buffer: matchedFile.buffer,
        originalname: matchedFile.originalname,
        mimetype: matchedFile.mimetype,
        propertyId,
        folder: "plans",
      });

      // delete old S3 object if present
      if (existingEntry?.plan?.key) {
        await deleteS3ObjectIfExists(existingEntry.plan.key);
      }

      incomingEntry.plan = {
        url: up.url,
        key: up.key,
        filename: matchedFile.originalname,
        mimetype: matchedFile.mimetype,
      };
      continue;
    }

    // external URL
    if (incomingEntry.planUrl) {
      if (deleteOldS3OnExternalUrl && existingEntry?.plan?.key) {
        await deleteS3ObjectIfExists(existingEntry.plan.key);
      }
      incomingEntry.plan = {
        url: incomingEntry.planUrl,
        key: undefined,
        filename: undefined,
        mimetype: undefined,
      };
      continue;
    }

    // preserve existing plan if present
    if (existingEntry?.plan) {
      incomingEntry.plan = existingEntry.plan;
    } else {
      incomingEntry.plan = null;
    }
  }

  return bhkSummaryIncoming;
}

/**
 * Merge incoming bhkSummary (patch) into existing bhkSummary.
 * - tries to match by bhk value first
 * - falls back to index-based merge
 */
function mergeBhkSummary(existingArr: any[] = [], incomingArr: any[] = []) {
  const result: any[] = existingArr ? existingArr.slice() : [];
  for (let i = 0; i < incomingArr.length; i++) {
    const inc = incomingArr[i];
    if (typeof inc.bhk !== "undefined") {
      const idx = result.findIndex((r) => r && r.bhk === inc.bhk);
      if (idx >= 0) {
        result[idx] = { ...result[idx], ...inc };
      } else {
        result.push(inc);
      }
    } else {
      if (i < result.length) result[i] = { ...result[i], ...inc };
      else result.push(inc);
    }
  }
  return result;
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
        folder: "Builder_hero",
      });
      toCreate.heroImage = up.url;
      // optional: store heroImageKey in DB to be able to delete later
      // toCreate.heroImageKey = up.key;
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
      // toCreate.heroVideoKey = up.key;
    }

    // GALLERY FILES (multiple)
    const galleryFiles = files?.galleryFiles ?? [];
    if (galleryFiles.length > 0) {
      toCreate.gallerySummary = toCreate.gallerySummary || [];
      for (const f of galleryFiles) {
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
        // optionally store key: up.key
      }
    }

    // attach BHK plan files (create flow)
    const bhkPlanFiles = files?.bhkPlanFiles ?? [];
    toCreate.bhkSummary = toCreate.bhkSummary || [];
    // safety: ensure uploaded files count not greater than provided entries (index matching)
    if (bhkPlanFiles.length > toCreate.bhkSummary.length) {
      // not fatal but probably a client error — reject to avoid mismapping
      throw new Error("Too many bhkPlanFiles uploaded for provided bhkSummary entries");
    }
    toCreate.bhkSummary = await processBhkPlanUpdates({
      bhkSummaryExisting: [], // none on create
      bhkSummaryIncoming: toCreate.bhkSummary,
      bhkPlanFiles,
      propertyId: propId,
      deleteOldS3OnExternalUrl: false,
    });

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

    // apply payload fields (shallow copy)
    Object.keys(payload).forEach((k) => {
      (existing as any)[k] = (payload as any)[k];
    });

    const propId = existing._id!.toString();

    // --------- process BHK updates (files + planRemove + external URL) ----------
    const bhkSummaryIncoming = (payload as any).bhkSummary;
    const bhkPlanFiles = files?.bhkPlanFiles ?? [];

    if (Array.isArray(bhkSummaryIncoming)) {
      // basic safety
      if (bhkPlanFiles.length > bhkSummaryIncoming.length) {
        throw new Error("Too many bhkPlanFiles uploaded for provided bhkSummary entries");
      }

      // mergeIncoming => allows partial updates (client can send only changed entries)
      const mergedIncoming = mergeBhkSummary(existing.bhkSummary || [], bhkSummaryIncoming);

      const processed = await processBhkPlanUpdates({
        bhkSummaryExisting: existing.bhkSummary || [],
        bhkSummaryIncoming: mergedIncoming,
        bhkPlanFiles,
        propertyId: propId,
        deleteOldS3OnExternalUrl: true,
      });

      existing.bhkSummary = processed;
    }

    // replace hero image (if provided)
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
      // TODO: delete old hero key if you store it (existing.heroImageKey)
    }

    // replace hero video (if provided)
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
      // TODO: delete old heroVideoKey if you store it
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
        // optionally store key: up.key
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

  async getAlltop(options?: {
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

          filter.isFeatured = false;   // <-- THIS IS WHERE YOU ADDED IT

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
    // fetch existing doc so we can remove stored S3 objects (plans, optional hero/gallery keys)
    const existing = await FeaturedProject.findById(id).lean();
    if (!existing) return null;

    // delete BHK plan keys
    if (Array.isArray(existing.bhkSummary)) {
      for (const e of existing.bhkSummary) {
        if ((e as any)?.plan?.key) {
          await deleteS3ObjectIfExists((e as any).plan.key);
        }
      }
    }

    // Optionally delete hero/gallery/video keys here if you stored their keys:
    // if (existing.heroImageKey) await deleteS3ObjectIfExists(existing.heroImageKey);
    // if (Array.isArray(existing.gallerySummary)) { ... }

    const deleted = await FeaturedProject.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    await FeaturedProject.findByIdAndUpdate(id, { $inc: { "meta.views": 1 } }).exec();
  },
};
