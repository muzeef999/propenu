// src/services/featurePropertiesServices.ts
import mongoose from "mongoose";
import s3 from "../config/s3";
import FeaturedProject from "../models/featurePropertiesModel";
import {
  CreateFeaturePropertyDTO,
  UpdateFeaturePropertyDTO,
} from "../zod/validation";
import dotenv from "dotenv";
import { uploadFile } from "../utils/uploadFile";

dotenv.config({ quiet: true });

type MulterFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

function slugifyTitle(title: string) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  desiredTitleOrSlug: string,
  excludeId?: string
) {
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
  if (!Array.isArray(bhkSummary) || bhkSummary.length === 0)
    return { priceFrom: undefined, priceTo: undefined };
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
    console.error(
      "deleteS3ObjectIfExists failed for key:",
      key,
      e?.message || e
    );
    // don't rethrow — allow operation to continue
  }
}

function pickDefined<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => typeof v !== "undefined")
  ) as Partial<T>;
}

function normalizeGalleryInput(payload: any) {
  if (!payload || typeof payload !== "object") return;
  if (
    Array.isArray(payload.gallery) &&
    !Array.isArray(payload.gallerySummary)
  ) {
    payload.gallerySummary = payload.gallery;
  }
}

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
    if (
      !matchedFile &&
      incomingEntry.planFileName &&
      filesByName.has(incomingEntry.planFileName)
    ) {
      matchedFile = filesByName.get(incomingEntry.planFileName);
    }

    if (matchedFile) {
      // upload new file
      const up = await uploadFile({
        buffer: matchedFile.buffer,
        originalName: matchedFile.originalname,
        mimetype: matchedFile.mimetype,
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
  const summary = Array.isArray(incomingGallerySummary)
    ? incomingGallerySummary.slice()
    : [];

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
      const declaredName =
        summary[j]?.filename ?? summary[j]?.fileName ?? summary[j]?.file;
      if (declaredName && declaredName === file.originalname) {
        matchedIndex = j;
        break;
      }
    }

    // fallback to same index
    if (matchedIndex === -1) matchedIndex = i;

    // perform upload
    const up = await uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: "gallery",
    });

    // ensure entry exists
    if (!summary[matchedIndex]) summary[matchedIndex] = {};

    summary[matchedIndex].url = up.url;
    summary[matchedIndex].filename = file.originalname;
    // if title not provided, set to original name (nice fallback)
    if (!summary[matchedIndex].title)
      summary[matchedIndex].title = file.originalname;
    if (!summary[matchedIndex].category)
      summary[matchedIndex].category = "image";
    if (!summary[matchedIndex].order)
      summary[matchedIndex].order = matchedIndex + 1;
  }

  // final normalization: ensure every summary entry has url if it was an external link or uploaded file
  // entries with no url are left as-is (caller can decide to reject)
  return summary;
}

/* --------------------
   Service
   --------------------*/

export const FeaturePropertyService = {
  async createFeatureProperty(
    payload: CreateFeaturePropertyDTO,
    files?: MulterFiles
  ) {
    // 1) slug
    const slugSource =
      (payload.slug && String(payload.slug).trim()) || payload.title;
    const slug = await generateUniqueSlug(slugSource);

    // 2) compute prices
    const { priceFrom, priceTo } = computePriceRangeFromBhk(
      payload.bhkSummary as any[] | undefined
    );

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
      const up = await uploadFile({
        buffer: lf.buffer,
        originalName: lf.originalname,
        mimetype: lf.mimetype,
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
      const up = await uploadFile({
        buffer: f.buffer,
        originalName: f.originalname,
        mimetype: f.mimetype,
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
      const up = await uploadFile({
        buffer: v.buffer,
        originalName: v.originalname,
        mimetype: v.mimetype,
        folder: "video",
      });
      toCreate.heroVideo = up.url;
      // toCreate.heroVideoKey = up.key;
    }

    // BROCHURE (single PDF)  <-- PASTE STARTS HERE
    const brochureFiles = files?.brochure;
    if (brochureFiles && brochureFiles.length > 0) {
      const bf = brochureFiles[0] as Express.Multer.File;

      // 1) Basic validations (adjust as needed)
      const allowedMimeTypes = ["application/pdf"];
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

      if (!allowedMimeTypes.includes(bf.mimetype)) {
        throw new Error("Brochure must be a PDF (application/pdf)");
      }
      if (bf.size && bf.size > maxSizeBytes) {
        throw new Error("Brochure file too large (max 8MB)");
      }

      // 2) Upload to S3 (using your existing uploadFile util)
      const up = await uploadFile({
        buffer: bf.buffer,
        originalName: bf.originalname,
        mimetype: bf.mimetype,
        folder: "brochures", // folder/key prefix you want
        propertyId: propId, // optional, your upload util accepts it elsewhere
      });

      // 3) Save metadata into create payload
      toCreate.brochure = {
        url: up.url, // publicly accessible URL returned by uploadFile
        key: up.key, // S3 key (used for deletions later)
        filename: bf.originalname,
        mimetype: bf.mimetype,
      };
    } else if ((payload as any).brochureUrl) {
      // optional: client sent an external URL instead of uploading file
      toCreate.brochure = {
        url: (payload as any).brochureUrl,
        key: undefined,
        filename: undefined,
        mimetype: undefined,
      };
    }
    // BROCHURE block <-- PASTE ENDS HERE

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
    toCreate.gallerySummary = Array.isArray(mappedGallerySummary)
      ? mappedGallerySummary
      : [];

    // attach BHK plan files (create flow)
    const bhkPlanFiles = files?.bhkPlanFiles ?? [];
    toCreate.bhkSummary = toCreate.bhkSummary || [];
    // safety: ensure uploaded files count not greater than provided entries (index matching)
    if (bhkPlanFiles.length > toCreate.bhkSummary.length) {
      // not fatal but probably a client error — reject to avoid mismapping
      throw new Error(
        "Too many bhkPlanFiles uploaded for provided bhkSummary entries"
      );
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
      const incomingAboutArr: any[] = Array.isArray(
        (toCreate as any).aboutSummary
      )
        ? (toCreate as any).aboutSummary.slice()
        : (toCreate as any).about
        ? [{ ...(toCreate as any).about }]
        : [];

      const aboutFiles = files?.aboutImage;
      if (aboutFiles && aboutFiles.length > 0) {
        const f = aboutFiles[0];
        if (!f) throw new Error("Uploaded aboutImage file is missing");

        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          folder: "about",
        });

        // ensure at least one element (provide required rightContent)
        if (incomingAboutArr.length === 0)
          incomingAboutArr.push({ rightContent: "" });

        // write S3 metadata into first element (you can change index strategy if you need)
        incomingAboutArr[0].url = up.url;
        incomingAboutArr[0].key = up.key;
        incomingAboutArr[0].filename = f.originalname;
        incomingAboutArr[0].mimetype = f.mimetype;
      }

      // persist normalized array into create payload
      (toCreate as any).aboutSummary = incomingAboutArr;
      // keep convenience single object synced with first item
      if (incomingAboutArr.length > 0)
        (toCreate as any).about = { ...incomingAboutArr[0] };
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

  async updateFeatureProperty(
    id: string,
    payload: UpdateFeaturePropertyDTO,
    files?: MulterFiles
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await FeaturedProject.findById(id);
    if (!existing) return null;

    // normalize legacy gallery key if present on input
    normalizeGalleryInput(payload as any);

    // ---------- SLUG ----------
    if (
      (payload.slug && payload.slug !== existing.slug) ||
      (payload.title && payload.title !== existing.title)
    ) {
      const slugSource =
        (payload.slug && String(payload.slug).trim()) ||
        (payload.title as string);
      existing.slug = await generateUniqueSlug(slugSource, id);
    }

    // ---------- PRICE RANGE (if client provided bhkSummary) ----------
    if ((payload as any).bhkSummary) {
      const { priceFrom, priceTo } = computePriceRangeFromBhk(
        (payload as any).bhkSummary
      );
      if (priceFrom !== undefined) existing.priceFrom = priceFrom;
      if (priceTo !== undefined) existing.priceTo = priceTo;
    }

    // ---------- SAFE APPLY (do not blindly overwrite arrays) ----------
    const safeUpdate = pickDefined(payload as any);

    // extract gallerySummary from safeUpdate before removing it so we know client's explicit intent
    const incomingGallerySummary = (safeUpdate as any).gallerySummary;
    delete (safeUpdate as any).gallerySummary;

    // apply other fields (shallow)
    Object.assign(existing, safeUpdate);

    const propId = existing._id!.toString();

    // --------- process BHK updates (files + planRemove + external URL) ----------
    const bhkSummaryIncoming = (payload as any).bhkSummary;
    const bhkPlanFiles = files?.bhkPlanFiles ?? [];

    if (Array.isArray(bhkSummaryIncoming)) {
      if (bhkPlanFiles.length > bhkSummaryIncoming.length) {
        throw new Error(
          "Too many bhkPlanFiles uploaded for provided bhkSummary entries"
        );
      }

      const mergedIncoming = mergeBhkSummary(
        existing.bhkSummary || [],
        bhkSummaryIncoming
      );

      const processed = await processBhkPlanUpdates({
        bhkSummaryExisting: existing.bhkSummary || [],
        bhkSummaryIncoming: mergedIncoming,
        bhkPlanFiles,
        propertyId: propId,
        deleteOldS3OnExternalUrl: true,
      });

      existing.bhkSummary = processed;
    }

    // --------- LOGO replacement ----------
    const logoFiles = files?.logo;
    if (logoFiles && logoFiles.length > 0) {
      const lf = logoFiles[0]!;
      const up = await uploadFile({
        buffer: lf.buffer,
        originalName: lf.originalname,
        mimetype: lf.mimetype,
        folder: "logo",
        propertyId: propId,
      });

      const oldLogoKey = (existing as any).logo?.key;
      if (oldLogoKey) await deleteS3ObjectIfExists(oldLogoKey);

      (existing as any).logo = {
        url: up.url,
        key: up.key,
        filename: lf.originalname,
        mimetype: lf.mimetype,
      };
    }

    // --------- HERO image/video ----------
    const heroFiles = files?.heroImage;
    if (heroFiles && heroFiles.length > 0) {
      const f = heroFiles[0]!;
      const up = await uploadFile({
        buffer: f.buffer,
        originalName: f.originalname,
        mimetype: f.mimetype,
        folder: "hero",
        propertyId: propId,
      });
      existing.heroImage = up.url;
    }

    const heroVideoFiles = files?.heroVideo;
    if (heroVideoFiles && heroVideoFiles.length > 0) {
      const v = heroVideoFiles[0]!;
      const up = await uploadFile({
        buffer: v.buffer,
        originalName: v.originalname,
        mimetype: v.mimetype,
        folder: "video",
        propertyId: propId,
      });
      existing.heroVideo = up.url;
    }

    // ---------- GALLERY handling (preserve when omitted; clear only when explicit [] ) ----------
    const galleryFiles = files?.galleryFiles ?? [];

    // If client omitted gallerySummary and no files uploaded -> preserve existing gallerySummary
    if (
      typeof incomingGallerySummary === "undefined" &&
      galleryFiles.length === 0
    ) {
      // preserve existing.gallerySummary; migrate legacy `gallery` if present
      if (
        !Array.isArray((existing as any).gallerySummary) &&
        Array.isArray((existing as any).gallery)
      ) {
        (existing as any).gallerySummary = (existing as any).gallery.slice();
      }
    } else {
      // we will touch gallerySummary (client provided meta (maybe []) or files exist)
      if (
        !Array.isArray((existing as any).gallerySummary) &&
        Array.isArray((existing as any).gallery)
      ) {
        (existing as any).gallerySummary = (existing as any).gallery.slice();
      } else if (!Array.isArray((existing as any).gallerySummary)) {
        (existing as any).gallerySummary = [];
      }

      // If client explicitly provided gallerySummary array
      if (Array.isArray(incomingGallerySummary)) {
        if (incomingGallerySummary.length === 0) {
          // explicit clear requested
          (existing as any).gallerySummary = [];
        } else {
          for (let i = 0; i < incomingGallerySummary.length; i++) {
            const inc = incomingGallerySummary[i];
            if (i < (existing as any).gallerySummary.length) {
              (existing as any).gallerySummary[i] = {
                ...(existing as any).gallerySummary[i],
                ...inc,
              };
            } else {
              (existing as any).gallerySummary.push({ ...inc });
            }
          }
        }
      }

      // Map uploaded files into gallerySummary (match by filename, then fill empty slots or append)
      if (galleryFiles.length > 0) {
        const filesByName = new Map<string, Express.Multer.File>();
        for (const f of galleryFiles) filesByName.set(f.originalname, f);

        // match by declared filename first
        for (
          let i = 0;
          i < (existing as any).gallerySummary.length && filesByName.size > 0;
          i++
        ) {
          const entry = (existing as any).gallerySummary[i] as any;
          const declared = entry?.filename ?? entry?.fileName ?? entry?.file;
          if (declared && filesByName.has(declared)) {
            const f = filesByName.get(declared)!;
            const up = await uploadFile({
              buffer: f.buffer,
              originalName: f.originalname,
              mimetype: f.mimetype,
              folder: "gallery",
              propertyId: propId,
            });
            entry.url = up.url;
            entry.key = up.key;
            entry.filename = f.originalname;
            filesByName.delete(declared);
          }
        }

        // remaining files -> fill first empty slots, else append
        const remainingFiles = Array.from(filesByName.values());
        for (const file of remainingFiles) {
          if (!file) continue;
          const up = await uploadFile({
            buffer: file.buffer,
            originalName: file.originalname,
            mimetype: file.mimetype,
            folder: "gallery",
            propertyId: propId,
          });
          const emptySlotIndex = (existing as any).gallerySummary.findIndex(
            (e: any) => !e?.url
          );
          if (emptySlotIndex >= 0) {
            const slot = (existing as any).gallerySummary[
              emptySlotIndex
            ] as any;
            slot.url = up.url;
            slot.key = up.key;
            slot.filename = file.originalname;
            slot.title = slot.title ?? file.originalname;
            slot.category = slot.category ?? "image";
            slot.order = slot.order ?? emptySlotIndex + 1;
          } else {
            (existing as any).gallerySummary.push({
              title: file.originalname,
              url: up.url,
              key: up.key,
              filename: file.originalname,
              category: "image",
              order: ((existing as any).gallerySummary.length || 0) + 1,
            } as any);
          }
        }
      }
    } // end gallery handling

    // ---------- ABOUT merge & aboutImage replacement ----------
    {
      const incomingAboutArr: any[] = Array.isArray(
        (payload as any).aboutSummary
      )
        ? (payload as any).aboutSummary.slice()
        : (payload as any).about
        ? [{ ...(payload as any).about }]
        : [];

      const existingAboutArr: any[] = Array.isArray(
        (existing as any).aboutSummary
      )
        ? (existing as any).aboutSummary.slice()
        : [];

      for (let i = 0; i < incomingAboutArr.length; i++) {
        if (i < existingAboutArr.length)
          existingAboutArr[i] = {
            ...(existingAboutArr[i] || {}),
            ...incomingAboutArr[i],
          };
        else existingAboutArr.push({ ...incomingAboutArr[i] });
      }

      (existing as any).aboutSummary = existingAboutArr;

      const aboutFiles = files?.aboutImage;
      if (aboutFiles && aboutFiles.length > 0) {
        const f = aboutFiles[0]!;
        const up = await uploadFile({
          buffer: f.buffer,
          originalName: f.originalname,
          mimetype: f.mimetype,
          folder: "about",
          propertyId: propId,
        });

        if (
          !Array.isArray((existing as any).aboutSummary) ||
          (existing as any).aboutSummary.length === 0
        ) {
          (existing as any).aboutSummary = [{ rightContent: "" }];
        }

        const aboutArr: any[] = Array.isArray((existing as any).aboutSummary)
          ? (existing as any).aboutSummary
          : [{ rightContent: "" }];

        const oldKey = aboutArr[0]?.key;
        if (oldKey) await deleteS3ObjectIfExists(oldKey);

        aboutArr[0].url = up.url;
        aboutArr[0].key = up.key;
        aboutArr[0].filename = f.originalname;
        aboutArr[0].mimetype = f.mimetype;

        (existing as any).aboutSummary = aboutArr;
      }

      if (
        Array.isArray((existing as any).aboutSummary) &&
        (existing as any).aboutSummary.length > 0
      ) {
        (existing as any).about = {
          ...(existing as any).about,
          ...((existing as any).aboutSummary[0] as any),
        };
      }
    }

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

  async getFeaturesByCity(city: string) {
    const cleanCity = city.trim();

    const filter = {
      city: { $regex: `^${cleanCity}$`, $options: "i" },
    };

    const items = await FeaturedProject.find(filter)
      .select({
        title: 1,
        heroImage: 1,
        priceFrom: 1,
        priceTo: 1,
        slug: 1, // optional → useful for FE navigation
      })
      .lean();

    return {
      city: cleanCity,
      total: items.length,
      items,
    };
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
    if (options?.sortBy)
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const [items, total] = await Promise.all([
      FeaturedProject.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      FeaturedProject.countDocuments(filter).exec(),
    ]);
    return {
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  

  
async getAllHighlightProjects(options?: {
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

    filter.isFeatured = false;

    const sort: any = {};
    if (options?.sortBy)
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const [items, total] = await Promise.all([
      FeaturedProject.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      FeaturedProject.countDocuments(filter).exec(),
    ]);
    return {
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
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
    await FeaturedProject.findByIdAndUpdate(id, {
      $inc: { "meta.views": 1 },
    }).exec();
  },
};
