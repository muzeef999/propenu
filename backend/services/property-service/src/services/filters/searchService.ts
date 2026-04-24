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
  const normalized = value.trim().toLowerCase();
  return normalized === "appartment" ? "apartment" : normalized;
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

function getPropertyTypeList(filter: any) {
  if (typeof filter?.propertyType !== "string") return [];

  return filter.propertyType
    .split(",")
    .map(normalizePropertyType)
    .filter(Boolean);
}

function shouldIncludeFeaturedProjects(filter: any) {
  if (filter?.category !== "residential") return false;

  const propertyTypes = getPropertyTypeList(filter);
  if (propertyTypes.length > 0 && !propertyTypes.includes("apartment")) {
    return false;
  }

  if (filter.listingType && filter.listingType !== "sale") return false;
  if (filter.transactionType && filter.transactionType !== "new-sale") return false;

  const unsupportedFeaturedFilters = [
    "listingSource",
    "furnishing",
    "facing",
    "constructionStatus",
  ];

  return !unsupportedFeaturedFilters.some((key) => filter[key]);
}

function buildFeaturedProjectMatch(filter: any) {
  const match: any = {
    status: "active",

    // 🔥 EXCLUDE SPONSORED
    "promotion.type": { $ne: "sponsored" },

    // 🔥 EXPIRY HANDLING
    $and: [
      {
        $or: [
          { "promotion.boostExpiry": { $gt: new Date() } },
          { "promotion.type": { $in: ["normal", "featured"] } }
        ]
      },
      {
        $or: [
          { propertyType: { $exists: false } },
          { propertyType: null },
          { propertyType: "apartment" } // ✅ important fix
        ]
      }
    ]
  };

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
  const bhk = Number(filter.bhk ?? filter.bedrooms);
  if (!Number.isNaN(bhk)) {
    match["bhkSummary.bhk"] = bhk;
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
        transactionType: { $literal: "new-sale" },
        builtUpArea: "$sqftRange",
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
        bhk: "$bhkSummary.bhk",
        bhkSummary: 1,
        bedrooms: "$bhkSummary.bhk",
        bathrooms: { $literal: null },
        slug: 1,
        createdAt: 1,
        listingSource: { $literal: "featured" },
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
