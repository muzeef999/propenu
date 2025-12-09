// src/services/featurePropertiesServices.ts
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import s3 from "../config/s3"; // your AWS.S3 v2 client
import FeaturedProject from "../models/featurePropertiesModel";
import { CreateFeaturePropertyDTO, UpdateFeaturePropertyDTO } from "../zod/validation";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

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
 * Behavior unchanged from original.
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
   Gallery helpers
   --------------------*/

/**
 * Try to map uploaded files to gallerySummary entries.
 * Priority:
 *   1) If a gallerySummary entry has `filename` or `fileName`, match by that to uploaded file originalname.
 *   2) Else try index-based mapping (galleryFiles[0] -> gallerySummary[0]).
 * For create: if gallerySummary has fewer entries than files, push new entries for extra files.
 */
async function mapAndUploadGallery({
  incomingGallerySummary,
  galleryFiles,
  propertyId,
}: {
  incomingGallerySummary?: any[]; // may be undefined or [] or array of partial metadata
  galleryFiles?: Express.Multer.File[];
  propertyId: string;
}) {
  const files = galleryFiles ?? [];
  const summary = Array.isArray(incomingGallerySummary) ? incomingGallerySummary.slice() : [];

  // build filename map
  const filesByName = new Map<string, Express.Multer.File>();
  for (const f of files) filesByName.set(f.originalname, f);

  // first, ensure summary array exists and has at least as many entries as files for index mapping convenience
  // (we'll expand as needed later)
  // Note: we avoid mutating original incoming array reference beyond 'summary' local copy
  for (let i = 0; i < files.length; i++) {
    if (i >= summary.length) summary.push({});
  }

  // upload each file and set url on matched summary entry
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // guard against sparse arrays / undefined entries
    if (!file) continue;

    // try match by filename first: find index in summary that declares same filename
    let matchedIndex = -1;
    for (let j = 0; j < summary.length; j++) {
      const declaredName = summary[j]?.filename ?? summary[j]?.fileName ?? summary[j]?.file;
      if (declaredName && declaredName === file.originalname) {
        matchedIndex = j;
        break;
      }
    }

    // fallback to same index
    if (matchedIndex === -1) matchedIndex = i;

    // perform upload
    const up = await uploadBufferToS3Local({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      propertyId,
      folder: "gallery",
    });

    // ensure entry exists
    if (!summary[matchedIndex]) summary[matchedIndex] = {};

    summary[matchedIndex].url = up.url;
    summary[matchedIndex].filename = file.originalname;
    // if title not provided, set to original name (nice fallback)
    if (!summary[matchedIndex].title) summary[matchedIndex].title = file.originalname;
    if (!summary[matchedIndex].category) summary[matchedIndex].category = "image";
    if (!summary[matchedIndex].order) summary[matchedIndex].order = (matchedIndex + 1);
  }

  // final normalization: ensure every summary entry has url if it was an external link or uploaded file
  // entries with no url are left as-is (caller can decide to reject)
  return summary;
}

/* --------------------
   Service
   --------------------*/

export const FeaturePropertyService = {
 
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


    
    // LOGO (single file)
const logoFiles = files?.logo;
if (logoFiles && logoFiles.length > 0) {
  const lf = logoFiles[0]!;
  const up = await uploadBufferToS3Local({
    buffer: lf.buffer,
    originalname: lf.originalname,
    mimetype: lf.mimetype,
    propertyId: propId,
    folder: "logo",
  });
  // store full object so we can delete later
  toCreate.logo = {
    url: up.url,
    key: up.key,
    filename: lf.originalname,
    mimetype: lf.mimetype,
  };
}



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
    // incoming gallerySummary might be provided in payload (metadata)
    const incomingGallerySummary = (payload as any).gallerySummary;
    // map and upload; returns a normalized summary array (entries with url where uploaded)
    const mappedGallerySummary = await mapAndUploadGallery({
      incomingGallerySummary,
      galleryFiles,
      propertyId: propId,
    });

    // Merge with any incoming entries that had external URLs or metadata
    // If no incoming provided, mappedGallerySummary already contains created entries for uploaded files
    toCreate.gallerySummary = Array.isArray(mappedGallerySummary) ? mappedGallerySummary : [];

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



    //About Image (create section)
     // ---- About image (create) - normalize into aboutSummary array ----
{
  // normalize incoming about shapes into an array: prefer payload.aboutSummary, fallback to payload.about
  const incomingAboutArr: any[] = Array.isArray((toCreate as any).aboutSummary)
    ? (toCreate as any).aboutSummary.slice()
    : (toCreate as any).about
    ? [{ ...(toCreate as any).about }]
    : [];

  const aboutFiles = files?.aboutImage;
  if (aboutFiles && aboutFiles.length > 0) {
    const f = aboutFiles[0];
    if (!f) throw new Error("Uploaded aboutImage file is missing");

    const up = await uploadBufferToS3Local({
      buffer: f.buffer,
      originalname: f.originalname,
      mimetype: f.mimetype,
      propertyId: propId,
      folder: "about",
    });

    // ensure at least one element (provide required rightContent)
    if (incomingAboutArr.length === 0) incomingAboutArr.push({ rightContent: "" });

    // write S3 metadata into first element (you can change index strategy if you need)
    incomingAboutArr[0].url = up.url;
    incomingAboutArr[0].key = up.key;
    incomingAboutArr[0].filename = f.originalname;
    incomingAboutArr[0].mimetype = f.mimetype;
  }

  // persist normalized array into create payload
  (toCreate as any).aboutSummary = incomingAboutArr;
  // keep convenience single object synced with first item
  if (incomingAboutArr.length > 0) (toCreate as any).about = { ...incomingAboutArr[0] };
}
// -----------------------------------------------------------------


    // sanitize aboutDescription if present
    // if (toCreate.about?.aboutDescription && typeof toCreate.about.aboutDescription === "string") {
    //   toCreate.about.aboutDescription = sanitizeHtml(toCreate.about.aboutDescription, {
    //     allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    //     allowedAttributes: {
    //       a: ["href", "name", "target"],
    //       img: ["src", "alt"],
    //     },
    //   });
    // }

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

    // apply payload fields (shallow copy) for simple fields
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


    const logoFiles = files?.logo;
if (logoFiles && logoFiles.length > 0) {
  const lf = logoFiles[0]!;
  const up = await uploadBufferToS3Local({
    buffer: lf.buffer,
    originalname: lf.originalname,
    mimetype: lf.mimetype,
    propertyId: propId,
    folder: "logo",
  });

  // delete old logo key if present
  const oldLogoKey = (existing as any).logo?.key;
  if (oldLogoKey) {
    await deleteS3ObjectIfExists(oldLogoKey);
  }

  (existing as any).logo = {
    url: up.url,
    key: up.key,
    filename: lf.originalname,
    mimetype: lf.mimetype,
  };
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

    // GALLERY: merge incoming metadata then upload new files and attach urls
    const galleryFiles = files?.galleryFiles ?? [];
    const incomingGallerySummary = (payload as any).gallerySummary;

    // ensure existing.gallerySummary is array
    existing.gallerySummary = existing.gallerySummary || [];

    // If payload contains gallerySummary metadata, merge it into existing (index-based / append)
    if (Array.isArray(incomingGallerySummary)) {
      for (let i = 0; i < incomingGallerySummary.length; i++) {
        const inc = incomingGallerySummary[i];
        if (i < existing.gallerySummary.length) {
          existing.gallerySummary[i] = { ...existing.gallerySummary[i], ...inc };
        } else {
          existing.gallerySummary.push({ ...inc });
        }
      }
    }

    // Upload new gallery files and map them to existing.gallerySummary entries
    if (galleryFiles.length > 0) {
      // We attempt to map by filename first (if existing entries declare filename/fileName),
      // else by index offset after existing entries.
      // Build filesByName map for quick lookup
      const filesByName = new Map<string, Express.Multer.File>();
      for (const f of galleryFiles) filesByName.set(f.originalname, f);

      // First, try to match files to existing entries by declared filename property
      for (let i = 0; i < existing.gallerySummary.length && galleryFiles.length > 0; i++) {
        const entry = existing.gallerySummary[i] as any;
        const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
        if (declared && filesByName.has(declared)) {
              const f = filesByName.get(declared);
              if (!f) continue;
              const up = await uploadBufferToS3Local({
                buffer: f!.buffer,
                originalname: f!.originalname,
                mimetype: f!.mimetype,
                propertyId: propId,
                folder: "gallery",
              });
              // replace URL and store filename
              entry.url = up.url;
              entry.filename = f!.originalname;
              // remove from map so we don't process it again
              filesByName.delete(declared);
            }
      }

      // For remaining files (unmatched), map by order: append to the end or fill first empty slots
      const remainingFiles = Array.from(filesByName.values());
      let appendIndex = existing.gallerySummary.length;
      for (let idx = 0; idx < remainingFiles.length; idx++) {
        const file = remainingFiles[idx];
        // guard against sparse/undefined array slots (TypeScript may consider array access possibly undefined)
        if (!file) continue;

        const up = await uploadBufferToS3Local({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          propertyId: propId,
          folder: "gallery",
        });

        // try to find first existing entry without url
        const emptySlotIndex = existing.gallerySummary.findIndex((e: any) => !e.url);
        if (emptySlotIndex >= 0) {
          const slot = existing.gallerySummary[emptySlotIndex] as any;
          if (slot) {
            slot.url = up.url;
            slot.filename = file.originalname;
            if (!slot.title) slot.title = file.originalname;
            if (!slot.category) slot.category = "image";
            if (!slot.order) slot.order = emptySlotIndex + 1;
          } else {
            // fallback to append if slot is unexpectedly undefined
            existing.gallerySummary.push({
              title: file.originalname,
              url: up.url,
              filename: file.originalname,
              category: "image",
              order: (existing.gallerySummary.length || 0) + 1,
            } as any);
          }
        } else {
          // append new entry
          existing.gallerySummary.push({
            title: file.originalname,
            url: up.url,
            filename: file.originalname,
            category: "image",
            order: (existing.gallerySummary.length || 0) + 1,
          } as any);
        }
      }
    }

 
// ---- About image (create) - normalize into aboutSummary array ----
// ---- About merge & aboutImage replacement (update) ----
{
  // Build incomingAboutArr from payload.aboutSummary OR payload.about
  const incomingAboutArr: any[] = Array.isArray((payload as any).aboutSummary)
    ? (payload as any).aboutSummary.slice()
    : (payload as any).about
    ? [{ ...(payload as any).about }]
    : [];

  // ensure existing.aboutSummary is array (work on a properly typed local array to satisfy TS)
    const existingAboutArr: any[] = Array.isArray((existing as any).aboutSummary)
      ? (existing as any).aboutSummary.slice()
      : [];
  
    // merge incoming entries by index (simple index-merge) using the local array
    for (let i = 0; i < incomingAboutArr.length; i++) {
      if (i < existingAboutArr.length) {
        existingAboutArr[i] = { ...(existingAboutArr[i] || {}), ...incomingAboutArr[i] };
      } else {
        existingAboutArr.push({ ...incomingAboutArr[i] });
      }
    }
  
    // write the normalized array back onto the existing document
    (existing as any).aboutSummary = existingAboutArr;

  // ABOUT image replacement (if file uploaded)
  const aboutFiles = files?.aboutImage;
  if (aboutFiles && aboutFiles.length > 0) {
    const f = aboutFiles[0];
    if (!f) throw new Error("Uploaded aboutImage file is missing");

    const up = await uploadBufferToS3Local({
      buffer: f.buffer,
      originalname: f.originalname,
      mimetype: f.mimetype,
      propertyId: propId,
      folder: "about",
    });

    // ensure at least one aboutSummary element exists (provide required rightContent)
    if (!Array.isArray(existing.aboutSummary) || existing.aboutSummary.length === 0) {
      // cast to any to satisfy TypeScript when IAboutSummary has required properties
      (existing as any).aboutSummary = [{ rightContent: "" }];
    }

    // ensure we have an array reference — TypeScript can't rely on earlier type guards across awaits
    const aboutArr: any[] = Array.isArray(existing.aboutSummary) ? existing.aboutSummary : [{ rightContent: "" }];
    
    // delete old S3 key if present on first element
    const oldKey = aboutArr[0]?.key;
    if (oldKey) await deleteS3ObjectIfExists(oldKey);

    // set new metadata on first element
    aboutArr[0].url = up.url;
    aboutArr[0].key = up.key;
    aboutArr[0].filename = f.originalname;
    aboutArr[0].mimetype = f.mimetype;
  }

  // sync convenience single object with first array element
  if (Array.isArray(existing.aboutSummary) && existing.aboutSummary.length > 0) {
    (existing as any).about = { ...(existing as any).about, ...(existing.aboutSummary[0] as any) };
  }
}
// ---------------------------------------------------------

// -----------------------------------------------------------------


    // save and return
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

    filter.isFeatured = true;

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

    // delete gallery keys if present (optional)
    if (Array.isArray(existing.gallerySummary)) {
      for (const g of existing.gallerySummary) {
        if ((g as any)?.key) {
          await deleteS3ObjectIfExists((g as any).key);
        }
      }
    } 

    const deleted = await FeaturedProject.findByIdAndDelete(id).exec();
    return deleted;
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    await FeaturedProject.findByIdAndUpdate(id, { $inc: { "meta.views": 1 } }).exec();
  },
};
