import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3";
import dotenv from "dotenv";
import LandPlot from "../models/landModel";
import { SearchFilters } from "../types/searchResultItem";
import { buildCommonMatch } from "../utils/filterBuilder";

dotenv.config();

type MulterFiles = { [field: string]: Express.Multer.File[] } | undefined;

/** slug helper */
function slugifyTitle(title: string) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** ensure slug uniqueness */
async function generateUniqueSlug(desiredTitleOrSlug: string, excludeId?: string) {
  const slug = slugifyTitle(desiredTitleOrSlug);
  const existing = await LandPlot.findOne({ slug }).select("_id").lean();
  if (existing) {
    if (excludeId && existing._id.toString() === excludeId) return slug;
    const err: any = new Error("Slug already in use");
    err.code = "SLUG_TAKEN";
    throw err;
  }
  return slug;
}

/** upload buffer to S3 */
async function uploadBufferToS3Local(opts: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  propertyId: string;
  folder?: string;
}): Promise<{ key: string; url: string }> {
  const { buffer, originalname, mimetype, propertyId, folder = "land" } = opts;
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

/** delete S3 object best-effort */
async function deleteS3ObjectIfExists(key?: string) {
  if (!key) return;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return;
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch (e: any) {
    console.error("deleteS3ObjectIfExists failed for key:", key, e?.message || e);
  }
}

/* -------------------- Service API -------------------- */
export function getLandPipeline(filters: SearchFilters) {
  const match = buildCommonMatch(filters);

  return [
    { $match: match },
    {
      $project: {
        _id: 0,
        id: "$_id",
        type: { $literal: "Land" },
        title: 1,
         gallery:1,
        slug:1,
        roadWidthFt:1,
        facing:1,
        price: 1,
        createdAt: 1
      }
    }
  ];
}


export const LandService = {
  async create(payload: any, files?: MulterFiles) {
    // generate slug
    const slugSource = (payload.slug && String(payload.slug).trim()) || payload.title;
    const slug = await generateUniqueSlug(slugSource);

    const toCreate: any = { ...payload, slug };

    // preliminary instance to get _id for S3 keys
    const preliminary = new LandPlot(toCreate);
    const propId = preliminary._id ? preliminary._id.toString() : String(Date.now());

    // gallery files
    const galleryFiles = files?.galleryFiles ?? [];
    if (galleryFiles.length > 0) {
      toCreate.gallery = Array.isArray(toCreate.gallery) ? toCreate.gallery.slice() : [];
      for (const f of galleryFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/gallery",
        });
        toCreate.gallery.push({ title: f.originalname, url: up.url, filename: f.originalname, mimetype: f.mimetype });
      }
    }

    // documents
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      toCreate.documents = Array.isArray(toCreate.documents) ? toCreate.documents.slice() : [];
      for (const f of documentsFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/documents",
        });
        toCreate.documents.push({ title: f.originalname, url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype });
      }
    }

    // soilTestReport (single)
    const soilFiles = files?.soilTestReport ?? [];
    if (soilFiles.length > 0) {
      const f = soilFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/soil",
        });
        toCreate.soilTestReport = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
      }
    }

    // conversionCertificateFile
    const convFiles = files?.conversionCertificateFile ?? [];
    if (convFiles.length > 0) {
      const f = convFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/conv",
        });
        toCreate.conversionCertificateFile = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
      }
    }

    // encumbranceCertificateFile
    const encFiles = files?.encumbranceCertificateFile ?? [];
    if (encFiles.length > 0) {
      const f = encFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/encumbrance",
        });
        toCreate.encumbranceCertificateFile = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
      }
    }

    const created = await LandPlot.create(toCreate);
    return created.toObject ? created.toObject() : created;
  },

  async update(id: string, payload: any, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await LandPlot.findById(id);
    if (!existing) return null;

    // slug/title update
    if ((payload.slug && payload.slug !== (existing as any).slug) || (payload.title && payload.title !== (existing as any).title)) {
      const slugSource = (payload.slug && String(payload.slug).trim()) || (payload.title as string);
      (existing as any).slug = await generateUniqueSlug(slugSource, id);
    }

    // shallow copy incoming fields
    Object.keys(payload || {}).forEach((k) => {
      (existing as any)[k] = (payload as any)[k];
    });

    const propId = existing._id ? existing._id.toString() : String(Date.now());

    // gallery merge + upload (merge by index)
    const galleryFiles = files?.galleryFiles ?? [];
    const incomingGallery = (payload as any).gallery;
    (existing as any).gallery = Array.isArray((existing as any).gallery) ? (existing as any).gallery : [];
    if (Array.isArray(incomingGallery)) {
      for (let i = 0; i < incomingGallery.length; i++) {
        const inc = incomingGallery[i];
        if (i < (existing as any).gallery.length) (existing as any).gallery[i] = { ...(existing as any).gallery[i], ...inc };
        else (existing as any).gallery.push({ ...inc });
      }
    }

    if (galleryFiles.length > 0) {
      const filesByName = new Map<string, Express.Multer.File>();
      for (const f of galleryFiles) filesByName.set(f.originalname, f);

      // try filename match then append
      for (let i = 0; i < (existing as any).gallery.length && filesByName.size > 0; i++) {
        const entry = (existing as any).gallery[i] as any;
        const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
        if (declared && filesByName.has(declared)) {
          const f = filesByName.get(declared);
          if (!f) continue;
          const up = await uploadBufferToS3Local({
            buffer: f.buffer,
            originalname: f.originalname,
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
        const up = await uploadBufferToS3Local({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "land/gallery",
        });
        (existing as any).gallery.push({ title: file.originalname, url: up.url, filename: file.originalname, mimetype: file.mimetype });
      }
    }

    // documents -> push
    const documentsFiles = files?.documents ?? [];
    if (documentsFiles.length > 0) {
      (existing as any).documents = Array.isArray((existing as any).documents) ? (existing as any).documents : [];
      for (const f of documentsFiles) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/documents",
        });
        (existing as any).documents.push({ title: f.originalname, url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype });
      }
    }

    // soilTestReport -> replace (single)
    const soilFiles = files?.soilTestReport ?? [];
    if (soilFiles.length > 0) {
      const f = soilFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/soil",
        });
        const oldKey = (existing as any).soilTestReport?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).soilTestReport = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
      }
    }

    // conversionCertificateFile -> replace single
    const convFiles = files?.conversionCertificateFile ?? [];
    if (convFiles.length > 0) {
      const f = convFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/conv",
        });
        const oldKey = (existing as any).conversionCertificateFile?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).conversionCertificateFile = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
      }
    }

    // encumbranceCertificateFile -> replace single
    const encFiles = files?.encumbranceCertificateFile ?? [];
    if (encFiles.length > 0) {
      const f = encFiles[0];
      if (f) {
        const up = await uploadBufferToS3Local({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          propertyId: propId,
          folder: "land/encumbrance",
        });
        const oldKey = (existing as any).encumbranceCertificateFile?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);
        (existing as any).encumbranceCertificateFile = { url: up.url, key: up.key, filename: f.originalname, mimetype: f.mimetype };
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

  async list(options?: { page?: number; limit?: number; q?: string; status?: string; city?: string }) {
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

    return { items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  },

  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await LandPlot.findById(id).lean().exec();
    if (!existing) return null;

    // remove S3 keys if present (best effort)
    if ((existing as any).soilTestReport?.key) await deleteS3ObjectIfExists((existing as any).soilTestReport.key);
    if ((existing as any).conversionCertificateFile?.key) await deleteS3ObjectIfExists((existing as any).conversionCertificateFile.key);
    if ((existing as any).encumbranceCertificateFile?.key) await deleteS3ObjectIfExists((existing as any).encumbranceCertificateFile.key);
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
       getPipeline: getLandPipeline
};

export default LandService;
