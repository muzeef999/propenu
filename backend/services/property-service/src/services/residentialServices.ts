// src/services/residential.service.ts
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3"; // your AWS.S3 v2 client
import dotenv from "dotenv";
import Residential from "../models/residentialModel";
import { SearchFilters } from "../types/searchResultItem";
import "../models/userModel";
import User from "../models/userModel";
import Role from "../models/roleModel";
import { uploadFile } from "../utils/uploadFile";
import { UpdateFeaturePropertySchema } from "../zod/validation";
import { extendResidentialFilters } from "./filters/residentialFilters";
import { ResidentialQuery } from "../types/filterTypes";
import { Request } from "express";
import { upsertCityAndLocality } from "./locationServices";
import { findRelatedProperties } from "./findRelatedProperties";

type RequestWithResidentialQuery = Request<
  {}, // req.params
  any, // res body
  any, // req body
  ResidentialQuery // ✅ req.query
>;
dotenv.config();

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

/* -------------------- Helpers -------------------- */

function pickDefined<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => typeof v !== "undefined")
  );
}

function normalizePayload(obj: any) {
  if (!obj) return obj;
  if (typeof obj.title === "string") obj.title = obj.title.trim();
  if (obj.price === "") obj.price = undefined;
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  return obj;
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
    const up = await await uploadFile({
      buffer: file?.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: "featured/gallery",
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

export async function findRelatedResidential(property: any) {
  if (!property?._id) return [];

  const query: any = {
    _id: { $ne: property._id },
    status: "active",

    // CORE similarity
    listingType: property.listingType,     // buy
    propertyType: property.propertyType,   // apartment
    city: property.city,                   // Hyderabad
  };

  // Optional BHK similarity (SAFE version)
  if (property.bhk) {
    query.bhk = { $in: [property.bhk, property.bhk - 1, property.bhk + 1] };
  }

  // Optional price band (±30%)
  if (property.price) {
    query.price = {
      $gte: property.price * 0.7,
      $lte: property.price * 1.3,
    };
  }

  const related = await Residential
    .find(query)
    .sort({ createdAt: -1 })
    .limit(6)
    .select("title slug price city locality bhk gallery propertyType listingType builtUpArea furnishing parkingDetails constructionStatus")
    .lean();

  return related;
}

/* -------------------- Service API -------------------- */

export const ResidentialPropertyService = {
  async create(payload: any, files?: MulterFiles) {
    // generate slug

    let toCreate = normalizePayload({ ...payload });

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
        const up = await await uploadFile({
          buffer: f?.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          folder: "featured/gallery",
          entityId: propId, // optional
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

    if (createdDoc.city && createdDoc.locality) {
      await upsertCityAndLocality({
        city: createdDoc.city,
        locality: createdDoc.locality,
        ...(createdDoc.state && { state: createdDoc.state }),
        ...(createdDoc.location?.coordinates && {
          coordinates: createdDoc.location.coordinates,
        }),
      });
    }

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
    const existing: any = existingRaw;

    // Validate using your UpdateFeaturePropertySchema (assumes you exported it)
    const parsed = UpdateFeaturePropertySchema.safeParse(payload);
    if (!parsed.success) {
      // handle validation error (return or throw)
      throw new Error(
        "Validation failed: " + JSON.stringify(parsed.error.issues)
      );
    }

    const data = parsed.data;
    const safeUpdate = pickDefined(data);
    const incomingGallery = safeUpdate.gallerySummary;
    delete safeUpdate.gallerySummary;
    Object.assign(existing, safeUpdate);

    const propId = existing._id ? existing._id.toString() : String(Date.now());

    existing.gallerySummary = Array.isArray(existing.gallerySummary)
      ? existing.gallerySummary
      : [];

    if (Array.isArray(incomingGallery)) {
      for (let i = 0; i < incomingGallery.length; i++) {
        const inc = incomingGallery[i];
        if (i < existing.gallerySummary.length) {
          existing.gallerySummary[i] = {
            ...existing.gallerySummary[i],
            ...inc,
          };
        } else {
          existing.gallerySummary.push({ ...inc });
        }
      }
    }

    // 2) Handle uploaded files (files.galleryFiles) -> map into gallerySummary
    const galleryFiles = files?.galleryFiles ?? [];
    if (galleryFiles.length > 0) {
      const filesByName = new Map<string, Express.Multer.File>();
      for (const f of galleryFiles) filesByName.set(f.originalname, f);

      for (
        let i = 0;
        i < existing.gallerySummary.length && filesByName.size > 0;
        i++
      ) {
        const entry = existing.gallerySummary[i] as any;
        const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
        if (declared && filesByName.has(declared)) {
          const f = filesByName.get(declared)!;
          const up = await uploadFile({
            buffer: f.buffer,
            originalName: f.originalname,
            mimetype: f.mimetype,
            folder: "featured/gallery",
            entityId: propId,
          });
          entry.url = up.url;
          entry.key = up.key;
          entry.filename = f.originalname;
          filesByName.delete(declared);
        }
      }

      // Remaining files -> append or fill empty slots
      const remainingFiles = Array.from(filesByName.values());
      for (const file of remainingFiles) {
        const up = await uploadFile({
          buffer: file.buffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          folder: "featured/gallery",
          entityId: propId,
        });
        const emptySlotIndex = existing.gallerySummary.findIndex(
          (e: any) => !e?.url
        );
        if (emptySlotIndex >= 0) {
          const slot = existing.gallerySummary[emptySlotIndex] as any;
          slot.url = up.url;
          slot.key = up.key;
          slot.filename = file.originalname;
          if (!slot.title) slot.title = file.originalname;
          if (!slot.category) slot.category = "image";
          if (!slot.order) slot.order = emptySlotIndex + 1;
        } else {
          existing.gallerySummary.push({
            title: file.originalname,
            url: up.url,
            key: up.key,
            filename: file.originalname,
            category: "image",
            order: existing.gallerySummary.length + 1,
          });
        }
      }
    }

    // documents -> upload
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      existing.documents = Array.isArray(existing.documents)
        ? existing.documents
        : [];
      for (const f of documentsFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          folder: "featured/documents",
          entityId: propId,
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

    // Final save
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

  getPipeline(filters: any) {
    const match = extendResidentialFilters(filters as any, {});

    return [
      { $match: match },
      {
        $project: {
          _id: 0,
          id: "$_id",
          type: { $literal: "Residential" },
          title: 1,
          city: 1,
          listingType: 1,
          transactionType: 1,
          builtUpArea: 1,
          constructionStatus: 1,
          furnishing: 1,
          parkingDetails: 1,
          pricePerSqft: 1,
          gallery: 1,
          buildingName: 1,
          price: 1,
          bhk: 1,
          bedrooms: 1,
          bathrooms: 1,
          slug: 1,
          createdAt: 1,
        },
      },
    ];
  },
};

export default ResidentialPropertyService;
