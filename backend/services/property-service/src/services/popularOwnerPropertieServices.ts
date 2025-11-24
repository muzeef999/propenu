// src/services/ownerPropertyService.ts
import mongoose from "mongoose";
import s3 from "../config/s3"; // your AWS.S3 v2 client (optional)
import { randomUUID } from "crypto";
import { IMediaItem } from "../types/popularOwnerTypes";
import OwnerPropertyModel from "../models/popularOwnerModel";

type MulterFile = Express.Multer.File;

function slugify(title: string) {
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Upload buffer to S3 and return { key, url } */
async function uploadBufferToS3Local(opts: { buffer: Buffer; originalname: string; mimetype: string; folder?: string; propertyId: string; }) {
  const { buffer, originalname, mimetype, folder = "owner_media", propertyId } = opts;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) {
    // S3 not configured — throw or return fallback
    throw new Error("Missing S3 configuration (AWS_S3_BUCKET/AWS_REGION)");
  }

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

/** When files are provided alongside media[] descriptions, match files by originalname to media.filename or by order */
function mapFilesByName(files: MulterFile[]) {
  const map = new Map<string, MulterFile>();
  for (const f of files) map.set(f.originalname, f);
  return map;
}

export const OwnerPropertyService = {
  /**
   * Create property
   * @param payload - parsed JSON body
   * @param mediaFiles - files uploaded via multer (req.files.mediaFiles)
   */
  async create(payload: any, mediaFiles: MulterFile[] = []) {
    // ensure ownerDetails.ownerId is ObjectId
    if (!payload.ownerDetails || !payload.ownerDetails.ownerId) {
      throw new Error("ownerDetails.ownerId is required");
    }
    if (typeof payload.ownerDetails.ownerId === "string") {
      payload.ownerDetails.ownerId = new mongoose.Types.ObjectId(payload.ownerDetails.ownerId);
    }
    if (payload.ownerProperties?.userRef && typeof payload.ownerProperties.userRef === "string") {
      payload.ownerProperties.userRef = new mongoose.Types.ObjectId(payload.ownerProperties.userRef);
    }

    // prepare media array
    let media: IMediaItem[] = Array.isArray(payload.media) ? payload.media.slice() : [];

    // if files provided: upload each and add to media if not already present
    if (mediaFiles && mediaFiles.length > 0) {
      const filesByName = mapFilesByName(mediaFiles);
      // try to attach by filename if provided in media item, otherwise append in same order
      for (let i = 0; i < mediaFiles.length; i++) {
        const f = mediaFiles[i];
        if (!f) continue;
        // find matching media item by filename
        let matchedIndex = media.findIndex((m) => m.filename === f.originalname || m.url === f.originalname || m.title === f.originalname);
        // if not found, try by order (first unmatched)
        if (matchedIndex === -1) {
          matchedIndex = media.findIndex((m) => !m.url || m.url.startsWith("file:") || !m.url);
        }

        // upload to s3
        let up;
        try {
          // create temporary id for property folder (use uuid)
          const propertyId = payload.slug ? slugify(payload.slug) : randomUUID();
          up = await uploadBufferToS3Local({ buffer: f.buffer, originalname: f.originalname, mimetype: f.mimetype, propertyId, folder: "owner_media" });
        } catch (e) {
          // If S3 not configured, use local path style (not ideal for prod)
          console.warn("upload to s3 failed:", (e as Error).message);
          up = { key: undefined, url: `/uploads/${f.originalname}` };
        }

        const mediaItem: IMediaItem = {
          type: "image", // default; client should pass type in payload.media if needed
          title: f.originalname,
          url: up.url,
          ...(up.key && { key: up.key }),
          filename: f.originalname,
          mimetype: f.mimetype,
        };

        if (matchedIndex !== -1) {
          media[matchedIndex] = { ...media[matchedIndex], ...mediaItem };
        } else {
          media.push(mediaItem);
        }
      }
    }

    // if no media at all, set a default sample image (local test file)
    if (!Array.isArray(media) || media.length === 0) {
      media = [
        {
          type: "image",
          title: "default",
          url: "/mnt/data/5f5885f3-c64d-4883-9dad-b5f418ab1c2c.png",
        },
      ];
    }

    payload.media = media;

    // auto-generate slug if missing
    if (!payload.slug && payload.title) payload.slug = slugify(payload.title);

    // compute priceFrom/priceTo if bhkSummary present (optional)
    if (Array.isArray(payload.bhkSummary) && payload.bhkSummary.length > 0) {
      const mins = payload.bhkSummary.map((b: any) => (typeof b.minPrice === "number" ? b.minPrice : undefined)).filter(Boolean);
      const maxs = payload.bhkSummary.map((b: any) => (typeof b.maxPrice === "number" ? b.maxPrice : undefined)).filter(Boolean);
      if (mins.length) payload.priceFrom = Math.min(...mins);
      if (maxs.length) payload.priceTo = Math.max(...maxs);
    } else {
      if (typeof payload.price === "number") payload.priceFrom = payload.priceTo = payload.price;
    }

    const doc = new OwnerPropertyModel(payload);
    await doc.save();
    return doc.toObject();
  },

  /** Update property. mediaFiles can contain new files to append/replace. */
  async update(id: string, patch: any, mediaFiles: MulterFile[] = []) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await OwnerPropertyModel.findById(id);
    if (!existing) return null;

    // coerce owner ids
    if (patch.ownerDetails?.ownerId && typeof patch.ownerDetails.ownerId === "string") {
      patch.ownerDetails.ownerId = new mongoose.Types.ObjectId(patch.ownerDetails.ownerId);
    }
    if (patch.ownerProperties?.userRef && typeof patch.ownerProperties.userRef === "string") {
      patch.ownerProperties.userRef = new mongoose.Types.ObjectId(patch.ownerProperties.userRef);
    }

    // handle incoming media array (replace or merge)
    let currentMedia: IMediaItem[] = Array.isArray(existing.media) ? existing.media.map((m) => ({ ...m })) : [];

    const incomingMedia = Array.isArray(patch.media) ? patch.media.slice() : [];

    // If client provided a complete media array, use it as base; otherwise keep currentMedia as base
    let baseMedia = incomingMedia.length ? incomingMedia : currentMedia;

    // upload new files and merge them
    if (mediaFiles && mediaFiles.length > 0) {
      const filesByName = mapFilesByName(mediaFiles);
      for (const f of mediaFiles) {
        const matchedIndex: number = baseMedia.findIndex((m: IMediaItem) => m.filename === f.originalname || m.title === f.originalname);
        // upload
        let up;
        try {
          const propertyId = existing._id!.toString();
          up = await uploadBufferToS3Local({ buffer: f.buffer, originalname: f.originalname, mimetype: f.mimetype, propertyId, folder: "owner_media" });
        } catch (e) {
          console.warn("upload to s3 failed:", (e as Error).message);
          up = { key: undefined, url: `/uploads/${f.originalname}` };
        }

        const mediaItem: IMediaItem = {
          type: "image",
          title: f.originalname,
          url: up.url,
          ...(up.key && { key: up.key }),
          filename: f.originalname,
          mimetype: f.mimetype,
        };

        if (matchedIndex !== -1) baseMedia[matchedIndex] = { ...baseMedia[matchedIndex], ...mediaItem };
        else baseMedia.push(mediaItem);
      }
    }

    // apply patch fields to existing doc
    Object.keys(patch).forEach((k) => {
      // avoid overriding media until we set it below
      if (k === "media") return;
      (existing as any)[k] = patch[k];
    });

    existing.media = baseMedia;

    // update slug if title changed and slug not provided
    if ((patch.title && !patch.slug) || (patch.slug && patch.slug !== existing.slug)) {
      existing.slug = patch.slug ? slugify(patch.slug) : slugify(patch.title || existing.title);
    }

    // recompute priceFrom/priceTo if bhkSummary present
    if (Array.isArray((patch as any).bhkSummary)) {
      const mins = (patch.bhkSummary || []).map((b: any) => (typeof b.minPrice === "number" ? b.minPrice : undefined)).filter(Boolean);
      const maxs = (patch.bhkSummary || []).map((b: any) => (typeof b.maxPrice === "number" ? b.maxPrice : undefined)).filter(Boolean);
      if (mins.length) existing.priceFrom = Math.min(...mins);
      if (maxs.length) existing.priceTo = Math.max(...maxs);
    } else if (typeof patch.price === "number") {
      existing.priceFrom = existing.priceTo = patch.price;
    }

    await existing.save();
    return existing.toObject();
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    return await OwnerPropertyModel.findById(id).lean().exec();
  },

  async getBySlug(slug: string) {
    if (!slug) throw new Error("Missing slug");
    return await OwnerPropertyModel.findOne({ slug }).lean().exec();
  },

  /** List with filters + geo search */
  async list(opts: {
    page?: number;
    limit?: number;
    q?: string;
    ownerId?: string;
    category?: string;
    subcategory?: string;
    city?: string;
    availabilityStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, opts.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (opts.q) filter.$text = { $search: opts.q };
    if (opts.category) filter.category = opts.category;
    if (opts.subcategory) filter.subcategory = opts.subcategory;
    if (opts.city) filter["location.city"] = opts.city;
    if (opts.availabilityStatus) filter.availabilityStatus = opts.availabilityStatus;
    if (typeof opts.minPrice === "number" || typeof opts.maxPrice === "number") {
      filter.price = {};
      if (typeof opts.minPrice === "number") filter.price.$gte = opts.minPrice;
      if (typeof opts.maxPrice === "number") filter.price.$lte = opts.maxPrice;
    }
    if (opts.ownerId) {
      const oid = new mongoose.Types.ObjectId(opts.ownerId);
      filter.$or = [{ "ownerDetails.ownerId": oid }, { "ownerProperties.userRef": oid }];
    }

    let query = OwnerPropertyModel.find(filter);

    // geo filter
    if (typeof opts.lat === "number" && typeof opts.lng === "number" && typeof opts.radiusKm === "number" && opts.radiusKm > 0) {
      const radiusInRadians = opts.radiusKm / 6378.1; // Earth radius in km
      query = OwnerPropertyModel.find({
        ...filter,
        "location.mapCoordinates": {
          $geoWithin: { $centerSphere: [[opts.lng, opts.lat], radiusInRadians] },
        },
      });
    }

    const sortField = opts.sortBy ?? "createdAt";
    const sortDir = opts.sortOrder === "asc" ? 1 : -1;
    query = query.sort({ [sortField]: sortDir, createdAt: -1 });

    const [items, total] = await Promise.all([query.skip(skip).limit(limit).lean().exec(), OwnerPropertyModel.countDocuments(filter).exec()]);
    return { items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  },

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const deleted = await OwnerPropertyModel.findByIdAndDelete(id).lean().exec();
    return deleted;
  },

  async getPropertiesByOwnerUserId(ownerUserId: string, page = 1, limit = 20) {
    const oid = new mongoose.Types.ObjectId(ownerUserId);
    return this.list({ ownerId: ownerUserId, page, limit });
  },
};
