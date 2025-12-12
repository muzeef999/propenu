import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3";
import dotenv from "dotenv";
import Commercial from "../models/commercialModel";
import { SearchFilters } from "../types/searchResultItem";
import { buildCommonMatch } from "../utils/filterBuilder";
import User from "../models/userModel";
import Role from "../models/roleModel";
import Residential from "../models/residentialModel";
import { uploadFile } from "../utils/uploadFile";
dotenv.config({ quiet: true });

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

/* -------------------- Helpers -------------------- */

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
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  return obj;
}

async function resolveListingSourceFromUser(
  createdBy?: string | mongoose.Types.ObjectId
) {

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

async function generateUniqueSlug(
  desiredTitleOrSlug: string,
  excludeId?: string
) {
  const slug = slugifyTitle(desiredTitleOrSlug);
  const existing = await Commercial.findOne({ slug }).select("_id").lean();
  if (existing) {
    if (excludeId && existing._id.toString() === excludeId) return slug;
    const err: any = new Error("Slug already in use");
    err.code = "SLUG_TAKEN";
    throw err;
  }
  return slug;
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

/* -------------------- gallery helper -------------------- */

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
      folder: "commercial/gallery",
    });

    if (!summary[matchedIndex]) summary[matchedIndex] = {};
    summary[matchedIndex].url = up.url;
    summary[matchedIndex].key = up.key;
    summary[matchedIndex].filename = file.originalname;
    if (!summary[matchedIndex].title)
      summary[matchedIndex].title = file.originalname;
    if (!summary[matchedIndex].order)
      summary[matchedIndex].order = matchedIndex + 1;
  }

  return summary;
}

/* -------------------- Search Implement -------------------- */

export function getCommercialPipeline(filters: SearchFilters) {
  const match = buildCommonMatch(filters);

  return [
    { $match: match },
    {
      $project: {
        _id: 0,
        id: "$_id",
        type: { $literal: "Commercial" },
        title: 1,
        slug: 1,
        gallery: 1,
        propertySubType: 1,
        superBuiltUpArea: 1,
        furnishedStatus: 1,
        floorNumber: 1,
        totalFloors: 1,
        price: 1,
        location: 1,
        createdAt: 1,
      },
    },
  ];
}

/* -------------------- Service API -------------------- */

export const CommercialService = {
  async create(payload: any, files?: MulterFiles) {
    const slugSource =
      (payload.slug && String(payload.slug).trim()) || payload.title;
    const slug = await generateUniqueSlug(slugSource);

    let toCreate: any = { ...payload, slug };

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

    // preliminary instance for id
    const preliminary = new Commercial(toCreate);
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

    // documents
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
          folder: "commercial/documents",
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

    // leaseDocuments
    const leaseFiles = files?.leaseDocuments ?? [];
    if (leaseFiles.length > 0) {
      toCreate.leaseDocuments = Array.isArray(toCreate.leaseDocuments)
        ? toCreate.leaseDocuments.slice()
        : [];
      for (const f of leaseFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "commercial/leases",
        });
        toCreate.leaseDocuments.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
    }

    // fireNOCFile (single)
    const fireFiles = files?.fireNOCFile;
    const firstFire = fireFiles?.[0];
    if (firstFire) {
      const up = await uploadFile({
        buffer: firstFire.buffer,
        originalName: firstFire.originalname,
        mimetype: firstFire.mimetype,
        propertyId: propId,
        folder: "commercial/fire",
      });
      toCreate.fireNOCFile = {
        url: up.url,
        key: up.key,
        filename: firstFire.originalname,
        mimetype: firstFire.mimetype,
      };
    }

    // occupancyCertificateFile (single)
    const occFiles = files?.occupancyCertificateFile;
    const firstOcc = occFiles?.[0];
    if (firstOcc) {
      const up = await uploadFile({
        buffer: firstOcc.buffer,
        originalName: firstOcc.originalname,
        mimetype: firstOcc.mimetype,
        propertyId: propId,
        folder: "commercial/occupancy",
      });
      toCreate.occupancyCertificateFile = {
        url: up.url,
        key: up.key,
        filename: firstOcc.originalname,
        mimetype: firstOcc.mimetype,
      };

      
    }

    const createdDoc = await Commercial.create(toCreate);
    const populated = await Commercial.findById(createdDoc._id)
      .populate("createdBy", "name email phone role roleId")
      .lean()
      .exec();
    return (
      populated ?? (createdDoc.toObject ? createdDoc.toObject() : createdDoc)
    );
  },

  async update(id: string, payload: any, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await Commercial.findById(id);
    if (!existing) return null;

    // slug/title changes (use any cast to avoid strict typing issues)
    const exAny: any = existing;
    if (
      (payload.slug && payload.slug !== exAny.slug) ||
      (payload.title && payload.title !== exAny.title)
    ) {
      const slugSource =
        (payload.slug && String(payload.slug).trim()) ||
        (payload.title as string);
      const slug = slugSource
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const found = await Commercial.findOne({ slug }).select("_id").lean();
      if (found && found._id.toString() !== id) {
        const err: any = new Error("Slug already in use");
        err.code = "SLUG_TAKEN";
        throw err;
      }
      exAny.slug = slug;
    }

    // shallow merge of payload onto existing
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
            folder: "commercial/gallery",
          });
          entry.url = up.url;
          entry.key = up.key;
          entry.filename = f.originalname;
          filesByName.delete(declared);
        }
      }

      const remainingFiles = Array.from(filesByName.values());
      for (const file of remainingFiles) {
        const up = await uploadFile({
          buffer: file.buffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "commercial/gallery",
        });
        const emptySlotIndex = (existing as any).gallery.findIndex(
          (e: any) => !e.url
        );
        if (emptySlotIndex >= 0) {
          const slot = (existing as any).gallery[emptySlotIndex] as any;
          if (slot) {
            slot.url = up.url;
            slot.key = up.key;
            slot.filename = file.originalname;
            if (!slot.title) slot.title = file.originalname;
            if (!slot.order) slot.order = emptySlotIndex + 1;
          } else {
            (existing as any).gallery.push({
              title: file.originalname,
              url: up.url,
              key: up.key,
              filename: file.originalname,
              order: ((existing as any).gallery.length || 0) + 1,
            });
          }
        } else {
          (existing as any).gallery.push({
            title: file.originalname,
            url: up.url,
            key: up.key,
            filename: file.originalname,
            order: ((existing as any).gallery.length || 0) + 1,
          });
        }
      }
    }

    // leaseDocuments
    const leaseFiles = files?.leaseDocuments ?? [];
    if (leaseFiles.length > 0) {
      (existing as any).leaseDocuments = Array.isArray(existing.leaseDocuments)
        ? existing.leaseDocuments
        : [];
      for (const f of leaseFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "commercial/leases",
        });
        (existing as any).leaseDocuments.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
    }

    // fireNOCFile replacement
    const fireFiles = files?.fireNOCFile;
    const firstFire2 = fireFiles?.[0];
    if (firstFire2) {
      const up = await uploadFile({
        buffer: firstFire2.buffer,
        originalName: firstFire2.originalname,
        mimetype: firstFire2.mimetype,
        propertyId: propId,
        folder: "commercial/fire",
      });
      const oldKey = (existing as any).fireNOCFile?.key;
      if (oldKey) await deleteS3ObjectIfExists(oldKey);
      (existing as any).fireNOCFile = {
        url: up.url,
        key: up.key,
        filename: firstFire2.originalname,
        mimetype: firstFire2.mimetype,
      };
    }

    // occupancy certificate replacement
    const occFiles = files?.occupancyCertificateFile;
    const firstOcc2 = occFiles?.[0];
    if (firstOcc2) {
      const up = await uploadFile({
        buffer: firstOcc2.buffer,
        originalName: firstOcc2.originalname,
        mimetype: firstOcc2.mimetype,
        propertyId: propId,
        folder: "commercial/occupancy",
      });
      const oldKey = (existing as any).occupancyCertificateFile?.key;
      if (oldKey) await deleteS3ObjectIfExists(oldKey);
      (existing as any).occupancyCertificateFile = {
        url: up.url,
        key: up.key,
        filename: firstOcc2.originalname,
        mimetype: firstOcc2.mimetype,
      };
    }

    await existing.save();
    return existing.toObject ? existing.toObject() : existing;
  },

  /* pushFilesToListing (optional helper) */
  async pushFilesToListing(id: string, pushMap: Record<string, any[]>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const pushObj: any = {};
    for (const [field, arr] of Object.entries(pushMap)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      if (field === "leaseDocuments" || field === "documents") {
        pushObj[field] = pushObj[field] || { $each: [] };
        pushObj[field].$each = pushObj[field].$each.concat(arr);
      } else if (field === "galleryFiles") {
        pushObj["gallery"] = pushObj["gallery"] || { $each: [] };
        pushObj["gallery"].$each = pushObj["gallery"].$each.concat(arr);
      } else {
        pushObj[field] = pushObj[field] || { $each: [] };
        pushObj[field].$each = pushObj[field].$each.concat(arr);
      }
    }
    if (!Object.keys(pushObj).length) return this.getById(id);
    await Commercial.findByIdAndUpdate(id, { $push: pushObj } as any).exec();
    return this.getById(id);
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Commercial.findById(id).lean().exec();
  },

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    return Commercial.findOne({ slug }).lean().exec();
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

    const sort: any = {};
    if (options?.sortBy)
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;

    const [items, total] = await Promise.all([
      Commercial.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      Commercial.countDocuments(filter).exec(),
    ]);

    return {
      items: items as any[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await Commercial.findById(id).lean().exec();
    if (!existing) return null;

    // remove stored S3 keys for gallery/documents/leases/fire/occupancy (best effort)
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
    if (Array.isArray((existing as any).leaseDocuments)) {
      for (const l of (existing as any).leaseDocuments) {
        if ((l as any)?.key) await deleteS3ObjectIfExists((l as any).key);
      }
    }
    if ((existing as any).fireNOCFile?.key)
      await deleteS3ObjectIfExists((existing as any).fireNOCFile.key);
    if ((existing as any).occupancyCertificateFile?.key)
      await deleteS3ObjectIfExists(
        (existing as any).occupancyCertificateFile.key
      );

    const deleted = await Commercial.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await Commercial.findByIdAndUpdate(id, {
      $inc: { "meta.views": 1 },
    }).exec();
    return null;
  },

  model: Commercial,
  getPipeline: getCommercialPipeline,
};

export default CommercialService;
