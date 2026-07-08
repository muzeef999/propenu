import AgriculturalService from "../agriculturalServices";
import CommercialService from "../commercialService";
import LandService from "../landService";
import ResidentialPropertyService from "../residentialServices";
import FeaturedProject from "../../models/featurePropertiesModel";

export const CATEGORY_SERVICE_MAP: Record<string, any> = {
  residential: ResidentialPropertyService,
  commercial: CommercialService,
  land: LandService,
  agricultural: AgriculturalService,
};

function normalizePropertyType(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  return normalized === "appartment" ? "apartment" : normalized;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function propertyTypeExactRegex(value: string) {
  return `^${normalizePropertyType(value)
    .split("-")
    .map(escapeRegex)
    .join("[\\s_-]+")}$`;
}

function parseBedroomTokens(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return { exact: [] as number[], plus: undefined as number | undefined };
  }

  const exact: number[] = [];
  let plus: number | undefined;

  String(value)
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .forEach((token) => {
      if (token === "6plus" || token === "6+") {
        plus = 6;
        return;
      }

      const parsed = Number(token.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed)) exact.push(parsed);
    });

  return { exact, plus };
}

function normalizeResidentialFilter(filter: any) {
  if (
    filter?.category !== "residential" ||
    typeof filter.propertyType !== "string"
  ) {
    return filter;
  }

  const propertyTypes = filter.propertyType
    .split(",")
    .map(normalizePropertyType)
    .filter(Boolean);

  return {
    ...filter,
    propertyType: propertyTypes.join(","),
  };
}

function getPropertyTypeList(filter: any): string[] {
  if (typeof filter?.propertyType !== "string") return [];

  return filter.propertyType
    .split(",")
    .map(normalizePropertyType)
    .filter(Boolean);
}

function normalizePostedByToken(token: string) {
  const normalized = token.trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (["owner", "owners", "user"].includes(normalized)) return "user";
  if (["agent", "agents", "sales_agent", "sales_manager"].includes(normalized)) {
    return "agent";
  }
  if (["builder", "builders"].includes(normalized)) return "builder";

  return normalized;
}

function getCreatedByRoleTokens(filter: any): string[] {
  if (typeof filter?.createdByRole !== "string") return [];

  return filter.createdByRole
    .split(",")
    .map(normalizePostedByToken)
    .filter(Boolean);
}

function hasActiveBrowseFilter(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((entry) =>
      hasActiveBrowseFilter(entry),
    );
  }

  return false;
}

function hasAppliedPropertyFilters(filter: any): boolean {
  if (!filter || typeof filter !== "object") return false;

  const ignoredKeys = new Set([
    "category",
    "listingType",
    "city",
    "state",
    "listingSource",
  ]);

  return Object.entries(filter).some(([key, value]) => {
    if (ignoredKeys.has(key)) return false;
    return hasActiveBrowseFilter(value);
  });
}

function shouldIncludeFeaturedProjects(filter: any) {
  if (!filter?.category || !CATEGORY_SERVICE_MAP[filter.category]) return false;

  if (filter.listingType && filter.listingType !== "sale") return false;

  const createdByRoleTokens = getCreatedByRoleTokens(filter);
  if (createdByRoleTokens.length > 0) {
    const hasBuilder = createdByRoleTokens.includes("builder");
    const hasNonBuilder = createdByRoleTokens.some((token) => token !== "builder");

    if (hasBuilder && !hasNonBuilder) return true;
    return false;
  }

  if (typeof filter.listingSource === "string" && filter.listingSource.trim()) {
    const listingSources = filter.listingSource
      .split(",")
      .map((source: string) => source.trim().toLowerCase())
      .filter(Boolean);

    return (
      listingSources.includes("featured") ||
      listingSources.includes("builder") ||
      listingSources.includes("builders")
    );
  }

  if (hasAppliedPropertyFilters(filter)) return false;

  return true;
}

function buildFeaturedProjectMatch(filter: any) {
  const match: any = {
    status: "active",
    categoryType: filter.category,

    // 🔥 INCLUDE ALL VALID PROMOTION TYPES
    $and: [
      {
        $or: [
          { "promotion.boostExpiry": { $gt: new Date() } },
          { "promotion.type": { $in: ["normal", "featured", "prime", "sponsored"] } },
        ],
      },
      {
        $or: [
          { propertyType: { $exists: false } },
          { propertyType: null },
          { propertyType: { $regex: "^apartment$", $options: "i" } } // ✅ important fix
        ],
      },
    ],
  };

  const propertyTypes = getPropertyTypeList(filter);
  match.$and = [match.$and[0]];

  if (propertyTypes.length > 0) {
    match.$and.push({
      $or: propertyTypes.map((propertyType) => ({
        propertyType: {
          $regex: propertyTypeExactRegex(propertyType),
          $options: "i",
        },
      })),
    });
  }

  // 🌍 LOCATION FILTER
  if (filter.city) {
    match.city = filter.city;
  }

  if (typeof filter.locality === "string" && filter.locality.trim()) {
    const localityList = filter.locality
      .split(",")
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (localityList.length > 0) {
      match.locality = { $in: localityList };
    }
  }

  // 🔍 SEARCH FILTER
  if (typeof filter.search === "string" && filter.search.trim()) {
    const words = filter.search
      .split(/\s+/)
      .map((w: string) => w.trim())
      .filter(Boolean);

    if (words.length > 0) {
      match.$and.push(
        ...words.map((word: string) => ({
          title: { $regex: word, $options: "i" }
        }))
      );
    }
  }

  // 🏠 BHK FILTER
  const bhk = parseBedroomTokens(filter.bhk ?? filter.bedrooms);
  if (bhk.exact.length > 0 || bhk.plus !== undefined) {
    const bedroomConditions: any[] = [];

    if (bhk.exact.length > 0) {
      bedroomConditions.push(
        { "projectSummary.bhk": { $in: bhk.exact } },
        { "bhkSummary.bhk": { $in: bhk.exact } },
      );
    }

    if (bhk.plus !== undefined) {
      bedroomConditions.push(
        { "projectSummary.bhk": { $gte: bhk.plus } },
        { "bhkSummary.bhk": { $gte: bhk.plus } },
      );
    }

    match.$and.push({ $or: bedroomConditions });
  }

  // 💰 PRICE FILTER
  const minPrice = Number(filter.minPrice);
  const maxPrice = Number(filter.maxPrice);

  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    const priceConditions: any[] = [];

    if (!Number.isNaN(minPrice)) {
      priceConditions.push({ priceTo: { $gte: minPrice } });
    }

    if (!Number.isNaN(maxPrice)) {
      priceConditions.push({ priceFrom: { $lte: maxPrice } });
    }

    if (priceConditions.length > 0) {
      match.$and.push(...priceConditions);
    }
  }

  // 🏊 AMENITIES
  if (typeof filter.amenities === "string") {
    const amenityList = filter.amenities
      .split(",")
      .map((a: string) => a.trim())
      .filter(Boolean);

    if (amenityList.length > 0) {
      match["amenities.title"] = { $all: amenityList };
    }
  }

  return match;
}

function getFeaturedProjectPipeline(filter: any) {
  return [
    { $match: buildFeaturedProjectMatch(filter) },
    {
      $project: {
        _id: 0,
        id: "$_id",
        type: { $literal: "FeaturedProject" },
        title: 1,
        locality: 1,
        city: 1,
        listingType: { $literal: "sale" },
        propertyType: 1,
        transactionType: { $literal: "new-sale" },
        builtUpArea: "$sqftRange",
        projectArea: 1,
        constructionStatus: { $literal: "under-construction" },
        furnishing: { $literal: null },
        parkingDetails: { $literal: null },
        pricePerSqft: { $literal: null },
        gallery: "$gallerySummary",
        buildingName: "$title",
        price: "$priceFrom",
        priceFrom: 1,
        priceTo: 1,
        amenities: 1,
        amenitiesCount: {
          $size: {
            $ifNull: ["$amenities", []],
          },
        },
        bhk: { $ifNull: ["$projectSummary.bhk", "$bhkSummary.bhk"] },
        projectSummary: { $ifNull: ["$projectSummary", "$bhkSummary"] },
        bedrooms: { $ifNull: ["$projectSummary.bhk", "$bhkSummary.bhk"] },
        bathrooms: { $literal: null },
        slug: 1,
        createdAt: 1,
        listingSource: { $literal: "featured" },
        promotion: 1,
      },
    },
  ];
}

function getSearchPipeline(service: any, filter: any) {
  const pipeline = service.getPipeline(filter);

  if (shouldIncludeFeaturedProjects(filter)) {
    pipeline.push({
      $unionWith: {
        coll: FeaturedProject.collection.name,
        pipeline: getFeaturedProjectPipeline(filter),
      },
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  return pipeline;
}

export async function countSearchResults(payload: any) {
  const { filter: rawFilter } = payload;
  const filter = normalizeResidentialFilter(rawFilter);

  if (!filter?.category) {
    throw new Error("category is required");
  }

  const service = CATEGORY_SERVICE_MAP[filter.category];

  if (!service) {
    return 0;
  }

  const pipeline = getSearchPipeline(service, filter);
  pipeline.push({ $count: "total" });

  const [result] = await service.model.aggregate(pipeline);
  return result?.total ?? 0;
}

export default async function buildSearchCursor(payload: any) {
  const { batchSize = 50 } = payload;
  const filter = normalizeResidentialFilter(payload.filter);

  if (!filter?.category) {
    throw new Error("category is required");
  }

  const service = CATEGORY_SERVICE_MAP[filter.category];

  if (!service) {
    throw new Error(`Invalid category: ${filter.category}`);
  }

  const pipeline = getSearchPipeline(service, filter);

  return service.model.aggregate(pipeline).cursor({ batchSize });
}
