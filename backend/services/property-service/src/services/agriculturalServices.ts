// src/services/agricultural.service.ts
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3";
import dotenv from "dotenv";
import Agricultural from "../models/agriculturalModel";
import { SearchFilters } from "../types/searchResultItem";
import User from "../models/userModel";
import Role from "../models/roleModel";
import { uploadFile } from "../utils/uploadFile";
import { extendAgriculturalFilters } from "./filters/agriculturalFilters";
import { upsertCityAndLocality } from "./locationServices";

dotenv.config({ quiet: true });

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;


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

/** helper: map & upload gallery files to S3 and return normalized gallery array */
async function mapAndUploadGallery({
  incomingGallery,
  galleryFiles,
  propertyId,
}: {
  incomingGallery?: any[];
  galleryFiles?: Express.Multer.File[];
  propertyId: string;
}) {
  const files = galleryFiles ?? [];
  const summary = Array.isArray(incomingGallery) ? incomingGallery.slice() : [];

  const filesByName = new Map<string, Express.Multer.File>();
  for (const f of files) filesByName.set(f.originalname, f);

  for (let i = 0; i < files.length; i++) {
    if (i >= summary.length) summary.push({});
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

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

    const up = await uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      propertyId,
      folder: "agricultural/gallery",
    });

    if (!summary[matchedIndex]) summary[matchedIndex] = {};
    summary[matchedIndex].url = up.url;
    summary[matchedIndex].filename = file.originalname;
    if (!summary[matchedIndex].title)
      summary[matchedIndex].title = file.originalname;
    if (!summary[matchedIndex].order)
      summary[matchedIndex].order = matchedIndex + 1;
  }

  return summary;
}

/* --------------------  Search API  -------------------- */



function normalizePayload(obj: any) {
  if (!obj) return obj;
  if (typeof obj.title === "string") obj.title = obj.title.trim();
  if (obj.price === "") obj.price = undefined;
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  return obj;
}

async function resolveListingSourceFromUser(
  createdBy?: string | mongoose.Types.ObjectId
) {
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

/* --------------------  Service API  -------------------- */

export const AgriculturalService = {
  async create(payload: any, files?: MulterFiles) {
    // build slug and ensure uniqueness

    let toCreate: any = { ...payload};

    toCreate = normalizePayload(toCreate);


    const preliminary = new Agricultural(toCreate);
        const propId = preliminary._id
          ? preliminary._id.toString()
          : String(Date.now());
    
        // gallery
        const galleryFiles = files?.galleryFiles ?? [];
        const mappedGallery = await mapAndUploadGallery({
          incomingGallery: toCreate.gallery,
          galleryFiles,
          propertyId: propId,
        });
        toCreate.gallery = Array.isArray(mappedGallery) ? mappedGallery : [];
    


    const documentsFiles = files?.documents ?? [];
        if (documentsFiles.length > 0) {
          const docRefs: any[] = Array.isArray(toCreate.documents)
            ? toCreate.documents.slice()
            : [];
          for (const f of documentsFiles) {
            const up = await uploadFile({
              buffer: f.buffer,
              originalName: f.originalname,
              mimetype: f.mimetype,
              propertyId: propId,
              folder: "agricultural/documents",
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

    // soilTestReport single file
    const soilFiles = files?.soilTestReport ?? [];
    if (soilFiles && soilFiles.length > 0) {
      const f = soilFiles[0]!;
      const up = await uploadFile({
        buffer: f.buffer,
        originalName: f.originalname,
        mimetype: f.mimetype,
        propertyId: propId,
        folder: "agricultural/soil",
      });

      toCreate.soilTestReport = {
        url: up.url,
        key: up.key,
        filename: f.originalname,
        mimetype: f.mimetype,
      };
    }

    const createdDoc = await Agricultural.create(toCreate);

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

    const populated = await Agricultural.findById(createdDoc._id)
      .populate("createdBy", "name email phone role roleId")
      .lean()
      .exec();
    return (
      populated ?? (createdDoc.toObject ? createdDoc.toObject() : createdDoc)
    );
  },

  async update(id: string, payload: any, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await Agricultural.findById(id);
    if (!existing) return null;

    // slug/title change handling
    // inside your update function in agricultural.service.ts
    if (
      (payload.slug && payload.slug !== (existing as any).slug) ||
      (payload.title && payload.title !== (existing as any).title)
    ) {
      const slugSource =
        (payload.slug && String(payload.slug).trim()) ||
        (payload.title as string);
      const slug = slugSource
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const found = await Agricultural.findOne({ slug }).select("_id").lean();
      if (found && found._id.toString() !== id) {
        const err: any = new Error("Slug already in use");
        err.code = "SLUG_TAKEN";
        throw err;
      }
      (existing as any).slug = slug;
    }

    // shallow merge payload
    Object.keys(payload || {}).forEach((k) => {
      (existing as any)[k] = (payload as any)[k];
    });

    const propId = existing._id ? existing._id.toString() : String(Date.now());

    // gallery merge & upload
    const galleryFiles = files?.galleryFiles ?? [];
    const incomingGallery = (payload as any).gallery;
    (existing as any).gallery = Array.isArray((existing as any).gallery)
      ? (existing as any).gallery
      : [];
    if (Array.isArray(incomingGallery)) {
      for (let i = 0; i < incomingGallery.length; i++) {
        const inc = incomingGallery[i];
        if (i < (existing as any).gallery.length)
          (existing as any).gallery[i] = {
            ...(existing as any).gallery[i],
            ...inc,
          };
        else (existing as any).gallery.push({ ...inc });
      }
    }

    if (galleryFiles.length > 0) {
      const filesByName = new Map<string, Express.Multer.File>();
      for (const f of galleryFiles) filesByName.set(f.originalname, f);

      for (
        let i = 0;
        i < (existing as any).gallery.length && filesByName.size > 0;
        i++
      ) {
        const entry = (existing as any).gallery[i] as any;
        const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
        if (declared && filesByName.has(declared)) {
          const f = filesByName.get(declared);
          if (!f) continue;
          const up = await uploadFile({
            buffer: f.buffer,
            originalName: f.originalname,
            mimetype: f.mimetype,
            propertyId: propId,
            folder: "agricultural/gallery",
          });
          entry.url = up.url;
          entry.filename = f.originalname;
          filesByName.delete(declared);
        }
      }

      for (const file of Array.from(filesByName.values())) {
        const up = await uploadFile({
          buffer: file.buffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "agricultural/gallery",
        });
        (existing as any).gallery.push({
          title: file.originalname,
          url: up.url,
          filename: file.originalname,
        });
      }
    }

    // documents -> append
    const documentFiles = files?.documents ?? [];
    if (documentFiles.length > 0) {
      (existing as any).documents = Array.isArray((existing as any).documents)
        ? (existing as any).documents
        : [];
      for (const f of documentFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "agricultural/documents",
        });
        (existing as any).documents.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
    }

    // soilTestReport replacement (single file)
    const soilFiles = files?.soilTestReport;
    const firstSoil = soilFiles?.[0];

    if (firstSoil) {
      const up = await uploadFile({
        buffer: firstSoil.buffer,
        originalName: firstSoil.originalname,
        mimetype: firstSoil.mimetype,
        propertyId: propId,
        folder: "agricultural/soil",
      });

      const oldKey = (existing as any).soilTestReport?.key;
      if (oldKey) {
        await deleteS3ObjectIfExists(oldKey);
      }

      (existing as any).soilTestReport = {
        url: up.url,
        key: up.key,
        filename: firstSoil.originalname,
        mimetype: firstSoil.mimetype,
      };
    }

    await existing.save();
    return existing.toObject ? existing.toObject() : existing;
  },

  async pushFilesToListing(id: string, pushMap: Record<string, any[]>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const pushObj: any = {};
    for (const [field, arr] of Object.entries(pushMap)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      if (field === "documents") {
        pushObj["documents"] = pushObj["documents"] || { $each: [] };
        pushObj["documents"].$each = pushObj["documents"].$each.concat(arr);
      } else if (field === "gallery") {
        pushObj["gallery"] = pushObj["gallery"] || { $each: [] };
        pushObj["gallery"].$each = pushObj["gallery"].$each.concat(arr);
      } else {
        pushObj[field] = pushObj[field] || { $each: [] };
        pushObj[field].$each = pushObj[field].$each.concat(arr);
      }
    }

    if (!Object.keys(pushObj).length) return this.getById(id);
    await Agricultural.findByIdAndUpdate(id, { $push: pushObj } as any).exec();
    return this.getById(id);
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Agricultural.findById(id).lean().exec();
  },

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    return Agricultural.findOne({ slug }).lean().exec();
  },

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    city?: string;
    status?: string;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.city) filter.city = options.city;
    if (options?.status) filter.status = options.status;

    const sort: any = {};
    if (options?.q) sort.createdAt = -1;
    else sort.createdAt = -1;

    const [items, total] = await Promise.all([
      Agricultural.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Agricultural.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await Agricultural.findById(id).lean().exec();
    if (!existing) return null;

    // remove stored S3 keys (best-effort)
    if (Array.isArray((existing as any).gallery)) {
      for (const g of (existing as any).gallery) {
        if ((g as any)?.key) await deleteS3ObjectIfExists((g as any).key);
      }
    }
    if (Array.isArray((existing as any).documents)) {
      for (const d of (existing as any).documents) {
        if ((d as any)?.key) await deleteS3ObjectIfExists((d as any).key);
      }
    }
    if ((existing as any).soilTestReport?.key)
      await deleteS3ObjectIfExists((existing as any).soilTestReport.key);

    const deleted = await Agricultural.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await Agricultural.findByIdAndUpdate(id, {
      $inc: { "meta.views": 1 },
    }).exec();
    return null;
  },

  
  model: Agricultural,
  getPipeline: (filters: any) => {
     const match = extendAgriculturalFilters(filters, {});

  return [
    { $match: match },
    {
      $project: {
        _id: 0,
        id: "$_id",
        totalArea:1,
        type: { $literal: "Agricultural" },
        title: 1,
        gallery: 1,
        price: 1,
        slug: 1,
        pricePerSqft:1,
        soilType: 1,
        waterSource: 1,
        accessRoadType: 1,
        createdAt: 1,
      },
    },
  ];
},
};

export default AgriculturalService;
