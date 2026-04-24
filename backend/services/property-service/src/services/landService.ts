import mongoose from "mongoose";
import s3 from "../config/s3";
import dotenv from "dotenv";
import LandPlot from "../models/landModel";
import { uploadFile } from "../utils/uploadFile";
import { extendLandFilters } from "./filters/landFilters";
import { upsertCityAndLocality } from "./locationServices";
import { findRelatedProperties } from "./findRelatedProperties";
import { createWatermarkedBuffer } from "../utils/imageProcessing";

dotenv.config({ quiet: true });

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

function normalizePayload(obj: any) {
  if (!obj) return obj;
  if (typeof obj.title === "string") obj.title = obj.title.trim();
  if (obj.price === "") obj.price = undefined;
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  if (Array.isArray(obj.amenities))
    obj.amenities = normalizeAmenitiesInput(obj.amenities);
  return obj;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripLegacyReadyToConstruct(title?: string, landName?: string) {
  if (!title || typeof title !== "string") return title;
  let cleaned = title
    .replace(/\bReady to Construct\b/gi, "")
    .trim();

  if (landName && typeof landName === "string") {
    const safeLandName = escapeRegex(landName.trim());
    if (safeLandName) {
      const landNamePattern = new RegExp(`\\s+in\\s+${safeLandName}\\b`, "gi");
      cleaned = cleaned.replace(landNamePattern, "");
    }
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

function normalizeAmenityKey(value?: string) {
  if (!value || typeof value !== "string") return value;
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeAmenitiesInput(amenities?: any[]) {
  if (!Array.isArray(amenities)) return amenities;
  return amenities.map((a) => {
    if (!a || typeof a !== "object") return a;
    const normalized = { ...a };
    const sourceKey = normalized.key ?? normalized.title;
    const normalizedKey = normalizeAmenityKey(sourceKey);
    if (normalizedKey) normalized.key = normalizedKey;
    return normalized;
  });
}

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

    const watermarkedBuffer = await createWatermarkedBuffer(file.buffer);

    const up = await uploadFile({
      buffer: watermarkedBuffer,
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

export async function findRelatedLand(property: any) {
  if (!property?._id) return [];

  const query: any = {
    _id: { $ne: property._id },
    status: "active",

    // CORE similarity
    listingType: property.listingType, // sale
    propertyType: property.propertyType, // land
    city: property.city,
  };

  // Optional plot area similarity (±25%)
  if (property.plotArea) {
    query.plotArea = {
      $gte: property.plotArea * 0.75,
      $lte: property.plotArea * 1.25,
    };
  }

  // Optional land-use zone similarity
  if (property.landUseZone) {
    query.landUseZone = property.landUseZone;
  }

  // Optional price band (±30%)
  if (property.price) {
    query.price = {
      $gte: property.price * 0.7,
      $lte: property.price * 1.3,
    };
  }

  const related = await LandPlot.find(query)
    .sort({ createdAt: -1 })
    .limit(6)
    .select(
      "title slug price city locality plotArea landUseZone gallery propertyType listingType",
    )
    .lean();

  return related;
}

/** delete S3 object best-effort */
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
      e?.message || e,
    );
  }
}

export const LandService = {
  async create(payload: any, files?: MulterFiles) {
    let toCreate = normalizePayload({ ...payload });

    // preliminary instance to get _id for S3 keys
    const preliminary = new LandPlot(toCreate);
    const propId = preliminary._id
      ? preliminary._id.toString()
      : String(Date.now());

    // gallery files
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
      toCreate.documents = Array.isArray(toCreate.documents)
        ? toCreate.documents.slice()
        : [];
      for (const f of documentsFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/documents",
        });
        toCreate.documents.push({
          title: f.originalname,
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        });
      }
    }

    // soilTestReport (single)
    const soilFiles = files?.soilTestReport ?? [];
    if (soilFiles.length > 0) {
      const f = soilFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/soil",
        });
        toCreate.soilTestReport = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    // conversionCertificateFile
    const convFiles = files?.conversionCertificateFile ?? [];
    if (convFiles.length > 0) {
      const f = convFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/conv",
        });
        toCreate.conversionCertificateFile = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    // encumbranceCertificateFile
    const encFiles = files?.encumbranceCertificateFile ?? [];
    if (encFiles.length > 0) {
      const f = encFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/encumbrance",
        });
        toCreate.encumbranceCertificateFile = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    const createdDoc = await LandPlot.create(toCreate);

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

    const populated = await LandPlot.findById(createdDoc._id)
      .populate("createdBy", "name email phone role roleId")
      .lean()
      .exec();
    return (
      populated ?? (createdDoc.toObject ? createdDoc.toObject() : createdDoc)
    );
  },

  async update(id: string, payload: any, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await LandPlot.findById(id);
    if (!existing) return null;
    if (Array.isArray(payload?.amenities)) {
      payload.amenities = normalizeAmenitiesInput(payload.amenities);
    }

    // shallow copy incoming fields
    Object.keys(payload || {}).forEach((k) => {
      (existing as any)[k] = (payload as any)[k];
    });

    const propId = existing._id ? existing._id.toString() : String(Date.now());

    // gallery merge + upload (merge by index)
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

      // try filename match then append
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
          const watermarkedBuffer = await createWatermarkedBuffer(f.buffer);
          const up = await uploadFile({
            buffer: watermarkedBuffer,
            originalName: f.originalname,
            mimetype: f.mimetype,
            propertyId: propId,
            folder: "land/gallery",
          });
          entry.url = up.url;
          entry.filename = f.originalname;
          filesByName.delete(declared);
        }
      }

      const remainingFiles = Array.from(filesByName.values());
      for (const file of remainingFiles) {
        if (!file) continue;
        const watermarkedBuffer = await createWatermarkedBuffer(file.buffer);
        const up = await uploadFile({
          buffer: watermarkedBuffer,
          originalName: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "land/gallery",
        });
        (existing as any).gallery.push({
          title: file.originalname,
          url: up.url,
          filename: file.originalname,
          mimetype: file.mimetype,
        });
      }
    }

    // documents -> push
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      (existing as any).documents = Array.isArray((existing as any).documents)
        ? (existing as any).documents
        : [];
      for (const f of documentsFiles) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/documents",
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

    // soilTestReport -> replace (single)
    const soilFiles = files?.soilTestReport ?? [];
    if (soilFiles.length > 0) {
      const f = soilFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/soil",
        });
        const oldKey = (existing as any).soilTestReport?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).soilTestReport = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    // conversionCertificateFile -> replace single
    const convFiles = files?.conversionCertificateFile ?? [];
    if (convFiles.length > 0) {
      const f = convFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/conv",
        });
        const oldKey = (existing as any).conversionCertificateFile?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).conversionCertificateFile = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    // encumbranceCertificateFile -> replace single
    const encFiles = files?.encumbranceCertificateFile ?? [];
    if (encFiles.length > 0) {
      const f = encFiles[0];
      if (f) {
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/encumbrance",
        });
        const oldKey = (existing as any).encumbranceCertificateFile?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).encumbranceCertificateFile = {
          url: up.url,
          key: up.key,
          filename: f.originalname,
          mimetype: f.mimetype,
        };
      }
    }

    await existing.save();
    return existing.toObject ? existing.toObject() : existing;
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await LandPlot.findById(id)
      .populate("createdBy", "name email phone roleId")
      .exec();
    if (!doc) return null;

    const cleanedTitle = stripLegacyReadyToConstruct(
      (doc as any).title,
      (doc as any).landName,
    );
    if (cleanedTitle && cleanedTitle !== (doc as any).title) {
      (doc as any).title = cleanedTitle;
      await doc.save();
    }

    return doc.toObject ? doc.toObject() : (doc as any);
  },

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    const doc = await LandPlot.findOne({ slug })
      .populate("createdBy", "name email phone roleId")
      .exec();
    if (!doc) return null;

    const cleanedTitle = stripLegacyReadyToConstruct(
      (doc as any).title,
      (doc as any).landName,
    );
    if (cleanedTitle && cleanedTitle !== (doc as any).title) {
      (doc as any).title = cleanedTitle;
      await doc.save();
    }

    return doc.toObject ? doc.toObject() : (doc as any);
  },

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    city?: string;
    sortBy?: string;                
  sortOrder?: "asc" | "desc";      
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.status) filter.status = options.status;
    if (typeof options?.city === "string") filter.city = options.city;

  const sort: any = {};

    // 🔥 PRIORITY SORT (MAIN LOGIC)
    sort["promotion.priority"] = -1;

    // existing logic
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      LandPlot.find(filter).sort(sort).populate("createdBy", "name email phone roleId").skip(skip).limit(limit).lean().exec(),
      LandPlot.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await LandPlot.findById(id).lean().exec();
    if (!existing) return null;

    // remove S3 keys if present (best effort)
    if ((existing as any).soilTestReport?.key)
      await deleteS3ObjectIfExists((existing as any).soilTestReport.key);
    if ((existing as any).conversionCertificateFile?.key)
      await deleteS3ObjectIfExists(
        (existing as any).conversionCertificateFile.key,
      );
    if ((existing as any).encumbranceCertificateFile?.key)
      await deleteS3ObjectIfExists(
        (existing as any).encumbranceCertificateFile.key,
      );
    if (Array.isArray((existing as any).documents)) {
      for (const d of (existing as any).documents) {
        if (d?.key) await deleteS3ObjectIfExists(d.key);
      }
    }
    if (Array.isArray((existing as any).gallery)) {
      for (const g of (existing as any).gallery) {
        if (g?.key) await deleteS3ObjectIfExists(g.key);
      }
    }

    const deleted = await LandPlot.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await LandPlot.findByIdAndUpdate(id, { $inc: { "meta.views": 1 } }).exec();
    return null;
  },

  async verifyDocument(
    propertyId: string,
    documentIndex: number,
    status: "verified" | "rejected",
  ) {
    const property = await LandPlot.findById(propertyId);
    if (!property) return null;

    if (!property.verificationDocuments?.[documentIndex]) {
  return {
    success: false,
    status: 400,
    message: "Invalid document index",
  };
}

    // 1️⃣ Update document status
    property.verificationDocuments[documentIndex].status = status;

    // 2️⃣ Check if ANY document is verified
    const hasVerified = property.verificationDocuments.some(
      (doc) => doc.status === "verified",
    );

    // 3️⃣ Auto publish if verified
    if (hasVerified) {
      property.status = "active";
      property.isPublished = true;
      property.completion = {
        percent: 100,
        step: 5,
        lastSection: "verification",
      };
    } else {
      property.status = "draft";
      property.isPublished = false;
    }

    await property.save();
    return property;
  },

  model: LandPlot,

  getPipeline: (filters: any) => {
    const match = extendLandFilters(filters, {});

    return [
      { $match: match },
      {
        $project: {
          _id: 0,
          id: "$_id",
          type: { $literal: "Land" },
          title: 1,
          dimensions: 1,
          gallery: 1,
          plotArea: 1,
          pricePerSqft: 1,
          slug: 1,
          listingSource: 1,
          landName: 1,

          roadWidthFt: 1,
          facing: 1,
          price: 1,
          createdAt: 1,
        },
      },
    ];
  },
};

export default LandService;
