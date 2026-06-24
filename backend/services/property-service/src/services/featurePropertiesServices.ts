// src/services/featurePropertiesServices.ts
import mongoose from "mongoose";
import s3 from "../config/s3";
import FeaturedProject from "../models/featurePropertiesModel";
import {
  CreateFeaturePropertyDTO,
  UpdateFeaturePropertyDTO,
} from "../zod/validation";
import dotenv from "dotenv";
import fs from "fs";
import { uploadFile } from "../utils/uploadFile";
import { upsertCityAndLocality } from "./locationServices";
import {
  normalizeListingAuditFields,
  restoreCreatedById,
} from "../utils/agentSubmission";

dotenv.config({ quiet: true });

type MulterFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

type LocationParams = {
  locality?: string;
  city?: string;
  state?: string;
};

type RankScope = {
  state: string;
  city: string;
};

function normalizeScopeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRankScope(source: any): RankScope {
  return {
    state: normalizeScopeValue(source?.state),
    city: normalizeScopeValue(source?.city),
  };
}

function rankScopesEqual(a: RankScope, b: RankScope) {
  return (
    a.state.toLowerCase() === b.state.toLowerCase() &&
    a.city.toLowerCase() === b.city.toLowerCase()
  );
}

function buildRankScopeFilter(scope: RankScope) {
  const fieldFilter = (value?: string) =>
    value ? exactCaseInsensitive(value) : null;

  return {
    state: fieldFilter(scope.state),
    city: fieldFilter(scope.city),
  };
}

function normalizeRank(value: unknown) {
  const rank = Number(value);
  return Number.isFinite(rank) ? Math.max(1, Math.trunc(rank)) : 1;
}

async function reserveFeatureProjectRankForCreate(toCreate: any) {
  const rank = normalizeRank(toCreate.rank);
  toCreate.rank = rank;

  await FeaturedProject.updateMany(
    {
      ...buildRankScopeFilter(getRankScope(toCreate)),
      rank: { $gte: rank },
    },
    { $inc: { rank: 1 } },
  );
}

async function reorderFeatureProjectRank(existing: any, safeUpdate: any) {
  if (typeof safeUpdate.rank !== "number") return;

  const oldRank = normalizeRank(existing.rank);
  const newRank = normalizeRank(safeUpdate.rank);
  safeUpdate.rank = newRank;

  const oldScope = getRankScope(existing);
  const nextScope = getRankScope({ ...existing.toObject(), ...safeUpdate });
  const sameScope = rankScopesEqual(oldScope, nextScope);

  if (sameScope && oldRank === newRank) return;

  const idFilter = { _id: { $ne: existing._id } };

  if (sameScope) {
    const scopeFilter = buildRankScopeFilter(nextScope);

    if (newRank < oldRank) {
      await FeaturedProject.updateMany(
        {
          ...scopeFilter,
          ...idFilter,
          rank: { $gte: newRank, $lt: oldRank },
        },
        { $inc: { rank: 1 } },
      );
      return;
    }

    await FeaturedProject.updateMany(
      {
        ...scopeFilter,
        ...idFilter,
        rank: { $gt: oldRank, $lte: newRank },
      },
      { $inc: { rank: -1 } },
    );
    return;
  }

  await FeaturedProject.updateMany(
    {
      ...buildRankScopeFilter(oldScope),
      ...idFilter,
      rank: { $gt: oldRank },
    },
    { $inc: { rank: -1 } },
  );

  await FeaturedProject.updateMany(
    {
      ...buildRankScopeFilter(nextScope),
      ...idFilter,
      rank: { $gte: newRank },
    },
    { $inc: { rank: 1 } },
  );
}

function exactCaseInsensitive(value: string) {
  return {
    $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    $options: "i",
  };
}

function buildPromotionTypeMatch(types: string[]) {
  const normalizedTypes = types.map((type) => type.trim()).filter(Boolean);

  if (normalizedTypes.length === 0) return undefined;

  const conditions: any[] = [];
  const explicitTypes = normalizedTypes.filter((type) => type !== "normal");

  if (explicitTypes.length > 0) {
    conditions.push({ "promotion.type": { $in: explicitTypes } });
  }

  if (normalizedTypes.includes("normal")) {
    conditions.push(
      { "promotion.type": "normal" },
      { "promotion.type": { $exists: false } },
      { "promotion.type": null },
    );
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

const emptyPromotionCounts = () => ({
  prime: 0,
  featured: 0,
  normal: 0,
  sponsored: 0,
});

const promotedPromotionTypes = ["featured", "sponsored", "prime"];

async function countPromotionTypes(filter: any) {
  const counts = emptyPromotionCounts();

  const grouped = await FeaturedProject.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $ifNull: ["$promotion.type", "normal"] },
        count: { $sum: 1 },
      },
    },
  ]);

  for (const item of grouped) {
    const key = String(item._id || "normal");
    if (key in counts) {
      counts[key as keyof ReturnType<typeof emptyPromotionCounts>] = item.count;
    }
  }

  return counts;
}

async function findFeatured(filter: any) {
  const items = await FeaturedProject.find(filter)
    .select({
      title: 1,
      heroImage: 1,
      priceFrom: 1,
      priceTo: 1,
      slug: 1,
      city: 1,
      locality: 1,
      state: 1,
      logo: 1,
      projectSummary: 1,
      bhkSummary: 1,
      amenities: 1,
    })
    .lean();

  return serializeFeaturedProjectList(items);
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
      e?.message || e,
    );
    // don't rethrow — allow operation to continue
  }
}

function pickDefined<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => typeof v !== "undefined"),
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

function normalizeAmenitiesInputs(amenities?: any[]) {
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

function isResidentialProjectPayload(payload?: any) {
  const categoryType = String(payload?.categoryType ?? "")
    .trim()
    .toLowerCase();
  const propertyType = String(payload?.propertyType ?? "")
    .trim()
    .toLowerCase();

  if (categoryType === "land") return false;
  if (categoryType === "residential") return true;

  return ["apartment", "flat", "villa"].some((type) =>
    propertyType.includes(type),
  );
}

function normalizeResidentialUnitArea(unit: any) {
  if (!unit || typeof unit !== "object") return unit;

  const normalized = { ...unit };
  const area = normalized.area;
  const fallbackSqft =
    typeof normalized.minSqft === "number" && Number.isFinite(normalized.minSqft)
      ? normalized.minSqft
      : typeof area?.sqftValue === "number" && Number.isFinite(area.sqftValue)
        ? area.sqftValue
        : typeof area?.value === "number" && Number.isFinite(area.value)
          ? area.value
          : undefined;

  if (
    typeof normalized.minSqft !== "number" &&
    typeof fallbackSqft === "number" &&
    fallbackSqft > 0
  ) {
    normalized.minSqft = fallbackSqft;
  }

  if (
    typeof normalized.maxSqft !== "number" &&
    typeof fallbackSqft === "number" &&
    fallbackSqft > 0
  ) {
    normalized.maxSqft = fallbackSqft;
  }

  delete normalized.area;
  return normalized;
}

function normalizeProjectSummaryInput(summary?: any[], payload?: any) {
  if (!Array.isArray(summary)) return summary;
  const shouldNormalizeResidentialArea = isResidentialProjectPayload(payload);

  return summary.map((item) => {
    if (!item || typeof item !== "object") return item;

    const { bhkLabel, ...rest } = item;
    const units =
      shouldNormalizeResidentialArea && Array.isArray(rest.units)
        ? rest.units.map(normalizeResidentialUnitArea)
        : rest.units;

    return {
      ...rest,
      label: item.label ?? bhkLabel,
      ...(Array.isArray(units) && { units }),
    };
  });
}

function getCanonicalProjectSummary(payload: any) {
  return normalizeProjectSummaryInput(
    payload?.projectSummary ?? payload?.bhkSummary,
    payload,
  );
}

function getProjectSummaryKey(item: any, fallbackIndex?: number) {
  if (!item || typeof item !== "object") return `index:${fallbackIndex ?? 0}`;

  const label = String(item.label ?? item.bhkLabel ?? "")
    .trim()
    .toLowerCase();

  if (label) {
    return `bhk:${item.bhk ?? ""}|label:${label}`;
  }

  if (typeof item.bhk !== "undefined") {
    return `bhk:${item.bhk}`;
  }

  return `index:${fallbackIndex ?? 0}`;
}

function serializeFeaturedProject<T extends any>(doc: T): T {
  if (!doc || typeof doc !== "object") return doc;

  const obj: any =
    typeof (doc as any).toObject === "function"
      ? (doc as any).toObject({ virtuals: false, aliases: false })
      : { ...(doc as any) };

  const projectSummary = getCanonicalProjectSummary(obj);
  if (Array.isArray(projectSummary)) {
    obj.projectSummary = projectSummary;
  }

  normalizeListingAuditFields(obj);
  if (Array.isArray(obj.updateHistory)) {
    obj.updateCount = Math.max(
      Number(obj.updateCount || 0),
      obj.updateHistory.length,
    );
  }

  delete obj.bhkSummary;

  return obj;
}

function serializeFeaturedProjectList<T extends any[]>(items: T): T {
  return items.map((item) => serializeFeaturedProject(item)) as T;
}

async function processBhkPlanUpdates(opts: {
  bhkSummaryExisting?: any[];
  bhkSummaryIncoming?: any[];
  bhkPlanFiles?: Express.Multer.File[];
  propertyId: string;
  deleteOldS3OnExternalUrl?: boolean;
}) {
  const {
    bhkSummaryIncoming = [],
    bhkPlanFiles = [],
    deleteOldS3OnExternalUrl = false,
  } = opts;

  // ✅ MAKE MUTABLE COPIES OF EXISTING
  const existingSummary: any[] = Array.isArray(opts.bhkSummaryExisting)
    ? opts.bhkSummaryExisting.map((b) => ({ ...b }))
    : [];
  const planUploadCache = new Map<
    string,
    Awaited<ReturnType<typeof uploadFile>>
  >();

  for (let b = 0; b < bhkSummaryIncoming.length; b++) {
    const incomingBhk = bhkSummaryIncoming[b];
    // const existingBhk = existingSummary[b] || { units: [] };
    const incomingKey = getProjectSummaryKey(incomingBhk, b);
    const existingBhk = existingSummary.find(
      (eb, index) => getProjectSummaryKey(eb, index) === incomingKey,
    ) || { units: [] };

    if (!Array.isArray(existingBhk.units)) {
      existingBhk.units = [];
    }

    for (let u = 0; u < incomingBhk.units.length; u++) {
      const incomingUnit = incomingBhk.units[u];
      // const existingUnit = existingBhk.units[u];

      const existingUnit = existingBhk.units.find(
        (eu: any) => eu._id?.toString() === incomingUnit._id?.toString(),
      );

      if (!incomingUnit) continue;

      /* 1️⃣ Match file by planFileName */
      const matchedFile = incomingUnit.planFileName
        ? bhkPlanFiles.find((f) => f.originalname === incomingUnit.planFileName)
        : undefined;

      console.log("=================================");
      console.log("Unit:", incomingUnit.label || incomingUnit._id);
      console.log("planFileName:", incomingUnit.planFileName);
      console.log("Matched:", matchedFile?.originalname);

      /* 2️⃣ Upload new plan */
      if (matchedFile) {
        console.log("File Path:", matchedFile.path);
        console.log("Exists Before Upload:", fs.existsSync(matchedFile.path));

        console.log("=================================");

        const cacheKey = matchedFile.path || matchedFile.originalname;
        let up = planUploadCache.get(cacheKey);

        if (!up) {
          up = await uploadFile({
            filePath: matchedFile.path,
            originalName: matchedFile.originalname,
            mimetype: matchedFile.mimetype,
            folder: "plans",
            propertyId: opts.propertyId,
          });
          planUploadCache.set(cacheKey, up);
        }

        if (existingUnit?.plan?.key) {
          await deleteS3ObjectIfExists(existingUnit.plan.key);
        }

        incomingUnit.plan = {
          url: up.url,
          key: up.key,
          filename: matchedFile.originalname,
          mimetype: matchedFile.mimetype,
        };

        delete incomingUnit.planFileName;
        delete incomingUnit.planUrl;
        continue;
      }

      /* 3️⃣ External URL */
      if (incomingUnit.planUrl) {
        if (deleteOldS3OnExternalUrl && existingUnit?.plan?.key) {
          await deleteS3ObjectIfExists(existingUnit.plan.key);
        }

        incomingUnit.plan = {
          url: incomingUnit.planUrl,
          key: undefined,
          filename: undefined,
          mimetype: undefined,
        };

        delete incomingUnit.planFileName;
        delete incomingUnit.planUrl;
        continue;
      }

      /* 4️⃣ Preserve existing */
      if (existingUnit?.plan) {
        incomingUnit.plan = existingUnit.plan;
        delete incomingUnit.planFileName;
        delete incomingUnit.planUrl;
        continue;
      }

      if (!incomingUnit.plan && existingUnit?.plan) {
        incomingUnit.plan = existingUnit.plan;
      }
    }
  }

  return bhkSummaryIncoming;
}

function mergeBhkSummary(existingArr: any[] = [], incomingArr: any[] = []) {
  const result: any[] = existingArr ? existingArr.slice() : [];
  for (let i = 0; i < incomingArr.length; i++) {
    const inc = incomingArr[i];
    const incomingKey = getProjectSummaryKey(inc, i);
    const idx = result.findIndex(
      (r, index) => getProjectSummaryKey(r, index) === incomingKey,
    );

    if (idx >= 0) {
      result[idx] = { ...result[idx], ...inc };
    } else {
      result.push(inc);
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
      filePath: file.path,
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
    files?: MulterFiles,
    user?: any,
  ) {
    const uploadedPaths = new Set<string>();

    if (Array.isArray((payload as any).amenities)) {
      (payload as any).amenities = normalizeAmenitiesInputs(
        (payload as any).amenities,
      );
    }

    // 1) slug
    const slugSource =
      (payload.slug && String(payload.slug).trim()) || payload.title;

    // 2) compute prices
    const projectSummary = getCanonicalProjectSummary(payload);
    const { priceFrom, priceTo } = computePriceRangeFromBhk(projectSummary);

    // 3) prepare base create payload
    const toCreate: any = {
      ...payload,
      projectSummary,
      priceFrom,
      priceTo,
      postedBy: user
        ? {
            userId: user.id,
            name: user.name,
            email: user.email,
            roleName: user.roleName,
          }
        : undefined,

      updateHistory: user
        ? [
            {
              userId: user.id,
              name: user.name,
              email: user.email,
              roleName: user.roleName,
              updatedAt: new Date(),
            },
          ]
        : [],
      updateCount: user ? 1 : 0,
    };
    delete toCreate.bhkSummary;

    // create a preliminary doc instance to get _id for S3 key naming (no DB write yet)
    const preliminary = new FeaturedProject(toCreate);
    const propId = preliminary._id!.toString();

    // LOGO (single file)
    const logoFiles = files?.logo;
    if (logoFiles && logoFiles.length > 0) {
      const lf = logoFiles[0]!;
      uploadedPaths.add(lf.path);

      const up = await uploadFile({
        filePath: lf.path,

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
        filePath: f.path,

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
        filePath: v.path,
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
        filePath: bf.path,
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
    toCreate.projectSummary = toCreate.projectSummary || [];
    // safety: ensure uploaded files count not greater than provided entries (index matching)
    // if (bhkPlanFiles.length > toCreate.bhkSummary.length) {
    //   // not fatal but probably a client error — reject to avoid mismapping
    //   throw new Error(
    //     "Too many bhkPlanFiles uploaded for provided bhkSummary entries",
    //   );
    // }

    const totalUnits = (toCreate.projectSummary || []).reduce(
      (sum: number, b: any) =>
        sum + (Array.isArray(b.units) ? b.units.length : 0),
      0,
    );

    if (bhkPlanFiles.length > totalUnits) {
      throw new Error("Too many bhkPlanFiles uploaded for provided bhk units");
    }

    toCreate.projectSummary = await processBhkPlanUpdates({
      bhkSummaryExisting: [], // none on create
      bhkSummaryIncoming: toCreate.projectSummary,
      bhkPlanFiles,
      propertyId: propId,
      deleteOldS3OnExternalUrl: false,
    });

    //About Image (create section)
    // ---- About image (create) - normalize into aboutSummary array ----
    {
      // normalize incoming about shapes into an array: prefer payload.aboutSummary, fallback to payload.about
      const incomingAboutArr: any[] = Array.isArray(
        (toCreate as any).aboutSummary,
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
          filePath: f.path,
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
    const createdDoc = await FeaturedProject.create(toCreate);

    for (const filePath of uploadedPaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted temp file:", filePath);
        }
      } catch (error) {
        console.error("Failed deleting temp file:", filePath, error);
      }
    }

    if (createdDoc.city && createdDoc.locality) {
      const coordinates = createdDoc.location?.coordinates;
      const localityCoordinates =
        Array.isArray(coordinates) && coordinates.length === 2
          ? ([coordinates[0], coordinates[1]] as [number, number])
          : undefined;

      await upsertCityAndLocality({
        city: createdDoc.city,
        locality: createdDoc.locality,
        ...(createdDoc.state && { state: createdDoc.state }),
        ...(localityCoordinates && { coordinates: localityCoordinates }),
      });
    }

    return serializeFeaturedProject(createdDoc);
  },

  async updateFeatureProperty(
    id: string,
    payload: UpdateFeaturePropertyDTO,
    files?: MulterFiles,
    user?: any,
  ) {

      const uploadedPaths = new Set<string>();

      
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const existing = await FeaturedProject.findById(id);
    if (!existing) return null;

    // normalize legacy gallery key if present on input
    normalizeGalleryInput(payload as any);

    // ---------- PRICE RANGE (if client provided bhkSummary) ----------
    const incomingProjectSummary = getCanonicalProjectSummary(payload);
    if (Array.isArray(incomingProjectSummary)) {
      const { priceFrom, priceTo } = computePriceRangeFromBhk(
        incomingProjectSummary,
      );
      if (priceFrom !== undefined) existing.priceFrom = priceFrom;
      if (priceTo !== undefined) existing.priceTo = priceTo;
    }

    // ---------- SAFE APPLY (do not blindly overwrite arrays) ----------
    const safeUpdate = pickDefined(payload as any);
    if (Array.isArray(incomingProjectSummary)) {
      (safeUpdate as any).projectSummary = incomingProjectSummary;
    }
    delete (safeUpdate as any).bhkSummary;
    if (Array.isArray((safeUpdate as any).amenities)) {
      (safeUpdate as any).amenities = normalizeAmenitiesInputs(
        (safeUpdate as any).amenities,
      );
    }

    // extract gallerySummary from safeUpdate before removing it so we know client's explicit intent
    const incomingGallerySummary = (safeUpdate as any).gallerySummary;
    delete (safeUpdate as any).gallerySummary;

    await reorderFeatureProjectRank(existing, safeUpdate);

    // apply other fields (shallow)
    Object.assign(existing, safeUpdate);

    if (user) {
      existing.lastUpdatedBy = {
        userId: user.id,
        name: user.name,
        email: user.email,
        roleName: user.roleName,
        updatedAt: new Date(),
      };

      existing.updateCount = (existing.updateCount || 0) + 1;

      existing.updateHistory = [
        ...(existing.updateHistory || []),

        {
          userId: user.id,
          name: user.name,
          email: user.email,
          roleName: user.roleName,
          updatedAt: new Date(),
        },
      ];
    }

    const propId = existing._id!.toString();

    // --------- process BHK updates (files + planRemove + external URL) ----------
    const bhkPlanFiles = files?.bhkPlanFiles ?? [];

    if (Array.isArray(incomingProjectSummary)) {
      const totalUnits = incomingProjectSummary.reduce(
        (sum: number, bhk: any) =>
          sum + (Array.isArray(bhk.units) ? bhk.units.length : 0),
        0,
      );

      if (bhkPlanFiles.length > totalUnits) {
        throw new Error(
          "Too many bhkPlanFiles uploaded for provided bhk units",
        );
      }

      const mergedIncoming = mergeBhkSummary(
        (existing as any).projectSummary || (existing as any).bhkSummary || [],
        incomingProjectSummary,
      );

      const processed = await processBhkPlanUpdates({
        bhkSummaryExisting:
          (existing as any).projectSummary ||
          (existing as any).bhkSummary ||
          [],
        bhkSummaryIncoming: mergedIncoming,
        bhkPlanFiles,
        propertyId: propId,
        deleteOldS3OnExternalUrl: true,
      });

      (existing as any).projectSummary =
        getCanonicalProjectSummary({
          ...existing.toObject(),
          ...payload,
          projectSummary: processed,
        }) ?? processed;
      (existing as any).bhkSummary = undefined;
    }

    // --------- LOGO replacement ----------
    const logoFiles = files?.logo;
    if (logoFiles && logoFiles.length > 0) {
      const lf = logoFiles[0]!;
      const up = await uploadFile({
        filePath: lf.path,
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
        filePath: f.path,
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
      uploadedPaths.add(v.path);
      const up = await uploadFile({
        filePath: v.path,
        originalName: v.originalname,
        mimetype: v.mimetype,
        folder: "video",
        propertyId: propId,
      });
      existing.heroVideo = up.url;
    }

    // --------- BROCHURE replacement ----------
    const brochureFiles = files?.brochure;
    if (brochureFiles && brochureFiles.length > 0) {
      const bf = brochureFiles[0] as Express.Multer.File;
      uploadedPaths.add(bf.path);
      const allowedMimeTypes = ["application/pdf"];
      const maxSizeBytes = 5 * 1024 * 1024;

      if (!allowedMimeTypes.includes(bf.mimetype)) {
        throw new Error("Brochure must be a PDF (application/pdf)");
      }

      if (bf.size && bf.size > maxSizeBytes) {
        throw new Error("Brochure file too large (max 5MB)");
      }

      const up = await uploadFile({
        filePath: bf.path,
        originalName: bf.originalname,
        mimetype: bf.mimetype,
        folder: "brochures",
        propertyId: propId,
      });

      const oldBrochureKey = (existing as any).brochure?.key;
      if (oldBrochureKey) await deleteS3ObjectIfExists(oldBrochureKey);

      (existing as any).brochure = {
        url: up.url,
        key: up.key,
        filename: bf.originalname,
        mimetype: bf.mimetype,
      };
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
              filePath: f.path,
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
            filePath: file.path,
            originalName: file.originalname,
            mimetype: file.mimetype,
            folder: "gallery",
            propertyId: propId,
          });
          const emptySlotIndex = (existing as any).gallerySummary.findIndex(
            (e: any) => !e?.url,
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
        (payload as any).aboutSummary,
      )
        ? (payload as any).aboutSummary.slice()
        : (payload as any).about
          ? [{ ...(payload as any).about }]
          : [];

      const existingAboutArr: any[] = Array.isArray(
        (existing as any).aboutSummary,
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
        uploadedPaths.add(f.path);
        const up = await uploadFile({
          filePath: f.path,
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
    return serializeFeaturedProject(existing);
  },

  async getMyHightlightProjects(userId: string) {
    const projects = await FeaturedProject.find({ createdBy: userId })
      .populate("createdBy", "name email phone")
      .lean();

    return serializeFeaturedProjectList(projects);
  },

  async getMyFeaturedProjects(userId: string) {
    const projects = await FeaturedProject.find({ createdBy: userId })
      .populate("createdBy", "name email phone")
      .lean();

    return serializeFeaturedProjectList(projects);
  },

  async getFeatureBySlug(slug: string) {
    if (!slug || typeof slug !== "string") {
      throw new Error("Invalid slug");
    }

    const original = await FeaturedProject.findOne({ slug })
      .select("createdBy")
      .lean();
    const doc = await FeaturedProject.findOne({ slug })
      .populate("createdBy", "name email phone role roleId")
      .populate("createdBy.roleId", "name label")
      .populate("approvedBy", "name email phone role roleId")
      .populate("approvedBy.roleId", "name label")
      .populate("lastUpdatedBy.userId", "name email phone role roleId")
      .populate("updateHistory.userId", "name email phone role roleId")
      .lean();

    return serializeFeaturedProject(
      await restoreCreatedById(FeaturedProject, doc, original?.createdBy),
    );
  },

  async getFeatureById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid id");
    }

    const original = await FeaturedProject.findById(id)
      .select("createdBy")
      .lean();
    const doc = await FeaturedProject.findById(id)
      .populate("createdBy", "name email phone role roleId")
      .populate("createdBy.roleId", "name label")
      .populate("approvedBy", "name email phone role roleId")
      .populate("approvedBy.roleId", "name label")
      .populate("lastUpdatedBy.userId", "name email phone role roleId")
      .populate("updateHistory.userId", "name email phone role roleId")
      .lean();

    return serializeFeaturedProject(
      await restoreCreatedById(FeaturedProject, doc, original?.createdBy),
    );
  },

  async getFeaturesByCity({ locality, city, state }: LocationParams) {
    // 🥇 1. Try LOCALITY
    const baseFilter = {
      status: "active",
      "promotion.type": { $in: ["featured", "sponsored"] },
      "promotion.boostExpiry": { $gt: new Date() },
    };
    if (locality) {
      const items = await findFeatured({
        ...baseFilter,
        locality: exactCaseInsensitive(locality),
      });

      if (items.length > 0) {
        return {
          level: "locality",
          value: locality,
          total: items.length,
          items,
        };
      }
    }

    if (city) {
      const items = await findFeatured({
        ...baseFilter,
        city: exactCaseInsensitive(city),
      });

      if (items.length > 0) {
        return { level: "city", value: city, total: items.length, items };
      }
    }

    // 🥉 3. Try STATE
    if (state) {
      const items = await findFeatured({
        ...baseFilter,
        state: exactCaseInsensitive(state),
      });

      if (items.length > 0) {
        return { level: "state", value: state, total: items.length, items };
      }
    }

    return {
      level: "none",
      total: 0,
      items: [],
    };
  },

  async getAllFeatures(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    promotionStatus?: "active" | "expired" | "all";
    type?: string; // 🔥 NEW
    city?: string; // 🔥 NEW
    state?: string; // 🔥 NEW
    locality?: string; // 🔥 NEW
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;

    const filter: any = {
      status: "active",
    };
    const andFilters: any[] = [];

    // 🔍 SEARCH
    if (options?.q) {
      filter.$text = { $search: options.q };
    }

    // 🔥 PROMOTION TYPE FILTER
    if (options?.type) {
      const promotionTypeMatch = buildPromotionTypeMatch(
        options.type.split(","),
      );

      if (promotionTypeMatch) {
        andFilters.push(promotionTypeMatch);
      }
    }

    // 🌍 LOCATION FILTER
    const makeRegex = (value?: string) =>
      value ? { $regex: `^${value.trim()}$`, $options: "i" } : undefined;

    if (options?.city) filter.city = makeRegex(options.city);
    if (options?.state) filter.state = makeRegex(options.state);
    if (options?.locality) filter.locality = makeRegex(options.locality);
    if ((options as any)?.createdBy) {
      filter.createdBy = new mongoose.Types.ObjectId((options as any).createdBy);
    }

    // 🔥 EXCLUDE EXPIRED PROMOTIONS
    const promotionStatus = options?.promotionStatus || "active";
    const now = new Date();

    if (promotionStatus === "expired") {
      andFilters.push({
        $or: [
          {
            "promotion.type": { $in: promotedPromotionTypes },
            "promotion.boostExpiry": { $lte: now },
          },
          {
            $and: [
              {
                $or: [
                  { "promotion.type": "normal" },
                  { "promotion.type": { $exists: false } },
                  { "promotion.type": null },
                ],
              },
              {
                promotionHistory: {
                  $elemMatch: {
                    fromType: { $in: promotedPromotionTypes },
                    toType: "normal",
                    reason: { $regex: "expired", $options: "i" },
                  },
                },
              },
            ],
          },
        ],
      });
    } else if (promotionStatus !== "all") {
      andFilters.push({
        $or: [
          { "promotion.boostExpiry": { $gt: now } },
          { "promotion.type": "normal" },
          { "promotion.type": { $exists: false } },
          { "promotion.type": null },
        ],
      });
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    // 🥇 SORT
    const sort: any = {
      "promotion.priority": -1,
    };

    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const [items, total, promotionCounts] = await Promise.all([
      FeaturedProject.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email phone city state locality pincode")
        .lean()
        .exec(),

      FeaturedProject.countDocuments(filter),

      (options as any)?.createdBy
        ? countPromotionTypes(filter)
        : Promise.resolve(undefined),
    ]);

    return {
      items: serializeFeaturedProjectList(items),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        ...(promotionCounts ? { promotionCounts } : {}),
      },
    };
  },

  async getHighlightByLocation({
    state,
    city,
    locality,
  }: {
    state?: string;
    city?: string;
    locality?: string;
  }) {
    const baseFilter: any = {
      status: "active",
      "promotion.type": { $in: ["featured", "sponsored"] },
      "promotion.boostExpiry": { $gt: new Date() }, // 🔥 NOT expired
    };

    const makeRegex = (value?: string) =>
      value ? { $regex: `^${value.trim()}$`, $options: "i" } : undefined;

    // 1️⃣ Locality level
    if (state || city || locality) {
      const localityFilter = {
        ...baseFilter,
        ...(state && { state: makeRegex(state) }),
        ...(city && { city: makeRegex(city) }),
        ...(locality && { locality: makeRegex(locality) }),
      };

      //checking
      const localityItems = await FeaturedProject.find(localityFilter)
        .select(
          "title heroImage priceFrom priceTo slug city state locality logo amenities projectSummary bhkSummary",
        )
        .sort({ rank: 1 })
        .limit(5)
        .lean();

      if (localityItems.length > 0) {
        return {
          level: "locality",
          total: localityItems.length,
          items: serializeFeaturedProjectList(localityItems),
        };
      }
    }

    // 2️⃣ City level fallback
    if (state || city) {
      const cityFilter = {
        ...baseFilter,
        ...(state && { state: makeRegex(state) }),
        ...(city && { city: makeRegex(city) }),
      };

      const cityItems = await FeaturedProject.find(cityFilter)
        .select("title heroImage priceFrom priceTo slug city state locality")
        .sort({ rank: 1 })
        .limit(5)
        .lean();

      if (cityItems.length > 0) {
        return {
          level: "city",
          total: cityItems.length,
          items: serializeFeaturedProjectList(cityItems),
        };
      }
    }

    // 3️⃣ State level fallback
    if (state) {
      const stateFilter = {
        ...baseFilter,
        state: makeRegex(state),
      };

      const stateItems = await FeaturedProject.find(stateFilter)
        .select("title heroImage priceFrom priceTo slug city state locality")
        .sort({ rank: 1 })
        .limit(5)
        .lean();

      return {
        level: "state",
        total: stateItems.length,
        items: serializeFeaturedProjectList(stateItems),
      };
    }

    return {
      level: "none",
      total: 0,
      items: [],
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
    const filter: any = {
      status: "active",
    };
    if (options?.q) filter.$text = { $search: options.q };
    if (options?.status) filter.status = options.status;

    filter.$or = [
      { "promotion.type": "normal" },
      { "promotion.type": { $exists: false } },
      { "promotion.type": null },
    ];

    const sort: any = {
      "promotion.priority": -1, // 🔥 MAIN LOGIC
      rank: -1,
      createdAt: -1,
    };
    if (options?.sortBy)
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const [items, total] = await Promise.all([
      FeaturedProject.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email phone city state locality pincode")
        .exec(),
      FeaturedProject.countDocuments(filter).exec(),
    ]);
    return {
      items: serializeFeaturedProjectList(items as any),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async deleteFeatureProperty(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    // fetch existing doc so we can remove stored S3 objects (plans, optional hero/gallery keys)
    const existing = await FeaturedProject.findById(id).lean();
    if (!existing) return null;

    // delete BHK plan keys
    const projectSummary =
      (existing as any).projectSummary ?? existing.bhkSummary;
    if (Array.isArray(projectSummary)) {
      for (const b of projectSummary) {
        for (const u of b.units || []) {
          if (u?.plan?.key) {
            await deleteS3ObjectIfExists(u.plan.key);
          }
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
