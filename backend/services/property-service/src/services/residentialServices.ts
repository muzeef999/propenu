// src/services/residential.service.ts
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3"; // your AWS.S3 v2 client
import dotenv from "dotenv";
import Residential from "../models/residentialModel";
import { buildCommonMatch } from "../utils/filterBuilder";
import { SearchFilters } from "../types/searchResultItem";
import "../models/userModel";
import User from "../models/userModel";
import Role from "../models/roleModel";

dotenv.config();

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

/* -------------------- Helpers -------------------- */

async function resolveListingSourceFromUser(createdBy?: string | mongoose.Types.ObjectId) {
  console.log("[DEBUG] resolveListingSourceFromUser called with:", createdBy);

  if (!createdBy) {
    return undefined;
  }
  const idStr = String(createdBy);
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    return undefined;
  }

  const user: any = await User.findById(idStr).select("role roleId").lean();

  if (!user) {
    return undefined;
  }

  if (user.role && typeof user.role === "string") {
    return user.role;
  }

  if (user.roleId) {
    const role: any = await Role.findById(user.roleId).select("label").lean();
    return role?.label;
  }

  return undefined;
}

function slugifyTitle(title: string) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePayload(obj: any) {
  if (!obj) return obj;
  if (typeof obj.title === "string") obj.title = obj.title.trim();
  if (obj.price === "") obj.price = undefined;
  // ensure arrays
  obj.gallery = Array.isArray(obj.gallery) ? obj.gallery : [];
  obj.documents = Array.isArray(obj.documents) ? obj.documents : [];
  // enforce createdBy is ObjectId string
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  return obj;
}

async function generateUniqueSlug(
  desiredTitleOrSlug: string,
  excludeId?: string
) {
  const slug = slugifyTitle(desiredTitleOrSlug);
  const existing = await Residential.findOne({ slug }).select("_id").lean();
  if (existing) {
    if (excludeId && existing._id.toString() === excludeId) return slug;
    const err: any = new Error("Slug already in use");
    err.code = "SLUG_TAKEN";
    throw err;
  }
  return slug;
}

async function uploadBufferToS3Local(opts: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  propertyId: string;
  folder?: string;
}): Promise<{ key: string; url: string }> {
  const {
    buffer,
    originalname,
    mimetype,
    propertyId,
    folder = "residential",
  } = opts;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region)
    throw new Error("Missing S3 bucket or region env var");

  const ext = originalname.includes(".") ? originalname.split(".").pop() : "";
  const uniqueName = `${Date.now()}-${randomUUID()}${ext ? "." + ext : ""}`;
  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const key = `${safeFolder}/${propertyId}/${uniqueName}`;

  await s3
    .upload({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimetype })
    .promise();
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
    key
  )}`;
  return { key, url };
}

async function deleteS3ObjectIfExists(key?: string) {
  if (!key) return;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return;
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch (e: any) {
    console.error(
      "deleteS3ObjectIfExists failed for key:",
      key,
      e?.message || e
    );
  }
}

/* -------------------- Gallery helper -------------------- */

async function mapAndUploadGallery({
  incomingGallery,
  galleryFiles,
  propertyId,
}: {
  incomingGallery?: any[];
  galleryFiles?: Express.Multer.File[];
  propertyId: string;
}): Promise<any[]> {
  const files = galleryFiles ?? [];
  const summary = Array.isArray(incomingGallery) ? incomingGallery.slice() : [];

  const filesByName = new Map<string, Express.Multer.File>();
  for (const f of files) filesByName.set(f.originalname, f);

  // ensure summary length for index mapping
  for (let i = 0; i < files.length; i++) {
    if (i >= summary.length) summary.push({});
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    // match by declared filename if available
    let matchedIndex = -1;
    for (let j = 0; j < summary.length; j++) {
      const declaredName =
        summary[j]?.filename ?? summary[j]?.fileName ?? summary[j]?.file;
      if (declaredName && declaredName === file.originalname) {
        matchedIndex = j;
        break;
      }
    }
    if (matchedIndex === -1) matchedIndex = i;

    // upload into residential folder
    const up = await uploadBufferToS3Local({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      propertyId,
      folder: "residential",
    });

    if (!summary[matchedIndex]) summary[matchedIndex] = {};
    summary[matchedIndex].url = up.url;
    summary[matchedIndex].key = up.key;
    summary[matchedIndex].filename = file.originalname;
    if (!summary[matchedIndex].title)
      summary[matchedIndex].title = file.originalname;
    if (!summary[matchedIndex].category)
      summary[matchedIndex].category = "image";
    if (!summary[matchedIndex].order)
      summary[matchedIndex].order = matchedIndex + 1;
  }

  return summary;
}

/* -------------------- Search pipeline -------------------- */

export function getResidentialPipeline(filters: SearchFilters) {
  const match = buildCommonMatch(filters);

  return [
    { $match: match },
    {
      $project: {
        _id: 0,
        id: "$_id",
        type: { $literal: "Residential" },
        gallery: 1,
        title: 1,
        city: 1,
        buildingName: 1,
        constructionStatus: 1,
        slug: 1,
        superBuiltUpArea: 1,
        furnishing: 1,
        parkingType: 1,
        price: 1,
        pricePerSqft: 1,
        location: 1,
        createdAt: 1,
      },
    },
  ];
}

/* -------------------- Service API -------------------- */

export const ResidentialPropertyService = {
  async create(payload: any, files?: MulterFiles) {
    // generate slug
    const slugSource =
      (payload.slug && String(payload.slug).trim()) || payload.title;
    const slug = await generateUniqueSlug(slugSource);

    let toCreate: any = {
      ...payload,
      slug,
    };

    toCreate = normalizePayload(toCreate);

    if (!toCreate.listingSource && toCreate.createdBy) {
      try {
        const listingSource = await resolveListingSourceFromUser(
          toCreate.createdBy
        );
        if (listingSource) toCreate.listingSource = listingSource;
      } catch (err) {
        console.warn("resolveListingSource failed:", (err as Error).message);
      }
    }

    // preliminary instance for _id (S3 key naming)
    const preliminary = new Residential(toCreate);
    const propId = preliminary._id
      ? preliminary._id.toString()
      : String(Date.now());

    // gallery mapping & upload (stored under "residential")
    const galleryFiles = files?.galleryFiles ?? [];
    const mappedGallery = await mapAndUploadGallery({
      incomingGallery: toCreate.gallery,
      galleryFiles,
      propertyId: propId,
    });
    toCreate.gallery = Array.isArray(mappedGallery) ? mappedGallery : [];

    // documents -> upload into "residential"
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      const docRefs: any[] = Array.isArray(toCreate.documents)
        ? toCreate.documents.slice()
        : [];
      for (const f of documentsFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "residential",
        });
        docRefs.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
      toCreate.documents = docRefs;
    }

    const createdDoc = await Residential.create(toCreate);

    const populated = await Residential.findById(createdDoc._id)
      .populate("createdBy", "name email phone role roleId")
      .lean()
      .exec();
    return (
      populated ?? (createdDoc.toObject ? createdDoc.toObject() : createdDoc)
    );
  },

  async update(id: string, payload: any, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existingRaw = await Residential.findById(id);
    if (!existingRaw) return null;

    // narrow to any to avoid TS complaints about slug/title — your IResidential should include them for strict typing
    const existing: any = existingRaw;

    // slug/title change
    if (
      (payload.slug && payload.slug !== existing.slug) ||
      (payload.title && payload.title !== existing.title)
    ) {
      const slugSource =
        (payload.slug && String(payload.slug).trim()) ||
        (payload.title as string);
      existing.slug = await generateUniqueSlug(slugSource, id);
    }

    // shallow copy payload onto existing doc
    Object.keys(payload || {}).forEach((k) => {
      existing[k] = (payload as any)[k];
    });

    const propId = existing._id ? existing._id.toString() : String(Date.now());

    // ---------- Gallery merge & upload ----------
    const galleryFiles = files?.galleryFiles ?? [];
    const incomingGallery = (payload as any).gallery;
    existing.gallery = Array.isArray(existing.gallery) ? existing.gallery : [];
    if (Array.isArray(incomingGallery)) {
      for (let i = 0; i < incomingGallery.length; i++) {
        const inc = incomingGallery[i];
        if (i < existing.gallery.length)
          existing.gallery[i] = { ...existing.gallery[i], ...inc };
        else existing.gallery.push({ ...inc });
      }
    }

    if (galleryFiles.length > 0) {
      const filesByName = new Map<string, Express.Multer.File>();
      for (const f of galleryFiles) filesByName.set(f.originalname, f);

      // match-by-declared-filename
      for (
        let i = 0;
        i < existing.gallery.length && filesByName.size > 0;
        i++
      ) {
        const entry = existing.gallery[i] as any;
        const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
        if (declared && filesByName.has(declared)) {
          const f = filesByName.get(declared);
          if (!f) continue;
          const up = await uploadBufferToS3Local({
            buffer: f.buffer,
            originalname: f.originalname,
            mimetype: f.mimetype,
            propertyId: propId,
            folder: "residential",
          });
          entry.url = up.url;
          entry.key = up.key;
          entry.filename = f.originalname;
          filesByName.delete(declared);
        }
      }

      // remaining files -> append / fill empty slots
      const remainingFiles = Array.from(filesByName.values());
      for (const file of remainingFiles) {
        const up = await uploadBufferToS3Local({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "residential",
        });
        const emptySlotIndex = existing.gallery.findIndex((e: any) => !e.url);
        if (emptySlotIndex >= 0) {
          const slot = existing.gallery[emptySlotIndex] as any;
          if (slot) {
            slot.url = up.url;
            slot.key = up.key;
            slot.filename = file.originalname;
            if (!slot.title) slot.title = file.originalname;
            if (!slot.category) slot.category = "image";
            if (!slot.order) slot.order = emptySlotIndex + 1;
          } else {
            existing.gallery.push({
              title: file.originalname,
              url: up.url,
              key: up.key,
              filename: file.originalname,
              category: "image",
              order: existing.gallery.length + 1,
            });
          }
        } else {
          existing.gallery.push({
            title: file.originalname,
            url: up.url,
            key: up.key,
            filename: file.originalname,
            category: "image",
            order: existing.gallery.length + 1,
          });
        }
      }
    }

    // documents -> upload into "residential"
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      existing.documents = Array.isArray(existing.documents)
        ? existing.documents
        : [];
      for (const f of documentsFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "residential",
        });
        existing.documents.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
    }

    await existing.save();
    return existing.toObject ? existing.toObject() : existing;
  },

  async pushFilesToListing(id: string, pushMap: Record<string, any[]>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const pushObj: any = {};
    for (const [field, arr] of Object.entries(pushMap)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      if (field === "gallery" || field === "galleryFiles") {
        pushObj["gallery"] = pushObj["gallery"] || { $each: [] };
        pushObj["gallery"].$each = pushObj["gallery"].$each.concat(arr);
      } else if (field === "documents") {
        pushObj["documents"] = pushObj["documents"] || { $each: [] };
        pushObj["documents"].$each = pushObj["documents"].$each.concat(arr);
      } else {
        pushObj[field] = pushObj[field] || { $each: [] };
        pushObj[field].$each = pushObj[field].$each.concat(arr);
      }
    }

    if (!Object.keys(pushObj).length) return this.getById(id);

    await Residential.findByIdAndUpdate(id, { $push: pushObj } as any).exec();
    return this.getById(id);
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Residential.findById(id)
      .populate("createdBy", "name email phone roleId")
      .lean()
      .exec();
  },

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    return Residential.findOne({ slug })
      .populate("createdBy", "name email phone roleId")
      .lean()
      .exec();
  },

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    near?: string;
    maxDistance?: number;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.status) filter.status = options.status;
    if (typeof options?.city === "string") filter.city = options.city;
    if (
      typeof options?.minPrice === "number" ||
      typeof options?.maxPrice === "number"
    ) {
      filter.price = {};
      if (typeof options?.minPrice === "number")
        filter.price.$gte = options!.minPrice;
      if (typeof options?.maxPrice === "number")
        filter.price.$lte = options!.maxPrice;
    }
    if (typeof options?.bedrooms === "number")
      filter.bedrooms = options!.bedrooms;
    if (typeof options?.bathrooms === "number")
      filter.bathrooms = options!.bathrooms;

    if (options?.near) {
      const [lngStr, latStr] = String(options.near).split(",");
      const lng = Number(lngStr);
      const lat = Number(latStr);
      if (!isNaN(lng) && !isNaN(lat)) {
        filter.location = {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: options?.maxDistance ?? 5000,
          },
        };
      }
    }

    const sort: any = {};
    if (options?.sortBy)
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const [items, total] = await Promise.all([
      Residential.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      Residential.countDocuments(filter).exec(),
    ]);
    return {
      items: items as any[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await Residential.findById(id).lean().exec();
    if (!existing) return null;

    // remove stored S3 keys for gallery and documents (best effort)
    if (Array.isArray((existing as any).gallery)) {
      for (const g of (existing as any).gallery) {
        if ((g as any)?.key) {
          await deleteS3ObjectIfExists((g as any).key);
        }
      }
    }
    if (Array.isArray((existing as any).documents)) {
      for (const d of (existing as any).documents) {
        if ((d as any)?.key) {
          await deleteS3ObjectIfExists((d as any).key);
        }
      }
    }

    const deleted = await Residential.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await Residential.findByIdAndUpdate(id, {
      $inc: { "meta.views": 1 },
    }).exec();
    return null;
  },

  model: Residential,
  
   getPipeline(filters: SearchFilters) {
    const matchObj: any = (filters as any).filter ?? filters ?? {};

    return [
      { $match: matchObj }
    ];
  }

};

export default ResidentialPropertyService;
