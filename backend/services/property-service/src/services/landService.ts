import mongoose from "mongoose";
import s3 from "../config/s3";
import dotenv from "dotenv";
import LandPlot from "../models/landModel";
import { uploadFile } from "../utils/uploadFile";
import { extendLandFilters } from "./filters/landFilters";
import { upsertCityAndLocality } from "./locationServices";
import { findRelatedProperties } from "./findRelatedProperties";

dotenv.config({ quiet: true });

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

function normalizePayload(obj: any) {
  if (!obj) return obj;
  if (typeof obj.title === "string") obj.title = obj.title.trim();
  if (obj.price === "") obj.price = undefined;
  if (obj.createdBy) obj.createdBy = String(obj.createdBy);
  return obj;
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

export function findRelatedLand(property: any) {
  return findRelatedProperties(property, {
    modelName: "Land",
    extraFilters: (p) => ({
      ...(p.plotArea && {
        plotArea: {
          $gte: p.plotArea * 0.8,
          $lte: p.plotArea * 1.2,
        },
      }),
      landUseZone: p.landUseZone,
    }),
  });
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
      e?.message || e
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
          const up = await uploadFile({
            buffer: f.buffer,
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
        const up = await uploadFile({
          buffer: file.buffer,
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
    return LandPlot.findById(id).lean().exec();
  },

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== "string") throw new Error("Invalid slug");
    return LandPlot.findOne({ slug }).lean().exec();
  },

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    city?: string;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.status) filter.status = options.status;
    if (typeof options?.city === "string") filter.city = options.city;

    const sort: any = { createdAt: -1 };

    const [items, total] = await Promise.all([
      LandPlot.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
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
        (existing as any).conversionCertificateFile.key
      );
    if ((existing as any).encumbranceCertificateFile?.key)
      await deleteS3ObjectIfExists(
        (existing as any).encumbranceCertificateFile.key
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
