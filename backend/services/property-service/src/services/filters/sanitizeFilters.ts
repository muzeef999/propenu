// src/services/filters/sanitizeFilters.ts

type SanitizedResult = {
  filter: Record<string, any>;
  batchSize: number;
};

/* -------------------- RESIDENTIAL CONFIG -------------------- */

const RESIDENTIAL_ALLOWED_FILTERS = [
  "category",
  "search",
  "listingType",
  "listingSource",
  "transactionType",
  "city",
  "locality",
  "furnishing",
  "constructionStatus",
  "propertyType",

  // numeric
  "bedrooms",
  "bhk",
  "minPrice",
  "maxPrice",

  // infra
  "batchSize",
];

const RESIDENTIAL_NUMERIC_FILTERS = new Set([
  "bedrooms",
  "bhk",
  "minPrice",
  "maxPrice",
  "batchSize",
]);

/* -------------------- COMMERCIAL CONFIG -------------------- */

const COMMERCIAL_ALLOWED_FILTERS = [
  "category",
  "search",
  "listingType",
  "listingSource",
  "city",
  "locality",
  "constructionStatus",

  // property
  "propertyType",
  "propertySubType",

  // furnishing / infra
  "furnishedStatus",
  "powerBackup",

  // numeric
  "minPrice",
  "maxPrice",
  "minCarpetArea",
  "maxCarpetArea",
  "floor",
  "floorNumber",
  "totalFloors",
  "minPowerCapacityKw",
  "maxPowerCapacityKw",

  // amenities
  "amenities",

  // infra
  "batchSize",
];

const COMMERCIAL_NUMERIC_FILTERS = new Set([
  "minPrice",
  "maxPrice",
  "minCarpetArea",
  "maxCarpetArea",
  "minPowerCapacityKw",
  "maxPowerCapacityKw",
  "batchSize",
]);

/* -------------------- LAND CONFIG -------------------- */

const LAND_ALLOWED_FILTERS = [
  "category",
  "search",
  "city",
  "locality",
  "listingType",
  "minPrice",
  "maxPrice",
  "minPlotArea",
  "maxPlotArea",
  "minDimensionLength",
  "minDimensionWidth",
  "plotAreaUnit",
  "landType",
  "propertyType",
  "landSubType",
  "propertySubType",
  "roadWidth",
  "minRoadWidthFt",
  "facing",
  "readyToConstruct",
  "waterConnection",
  "electricityConnection",
  "approvedBy",
  "approvedByAuthority",
  "landUseZone",
  "banksApproved",
  "postedBy",
  "listingSource",
  "verifiedProperties",
  "negotiable",
  "cornerPlot",
  "batchSize",
];

const LAND_NUMERIC_FILTERS = new Set([
  "minPrice",
  "maxPrice",
  "minPlotArea",
  "maxPlotArea",
  "minDimensionLength",
  "minDimensionWidth",
  "minRoadWidthFt",
  "batchSize",
]);

/* -------------------- AGRICULTURAL CONFIG -------------------- */

const AGRICULTURAL_ALLOWED_FILTERS = [
  "category",
  "search",
  "city",
  "locality",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "minTotalArea",
  "maxTotalArea",
  "minRoadWidthFt",
  "areaUnit",
  "propertyType",
  "propertySubType",
  "soilType",
  "irrigationType",
  "currentCrop",
  "waterSource",
  "roadWidth",
  "accessRoadType",
  "borewellCount",
  "minBorewells",
  "maxBorewells",
  "electricityConnection",
  "boundaryWall",
  "stateRestrictions",
  "statePurchaseRestrictions",
  "negotiable",
  "verifiedProperties",
  "listingSource",
  "postedBy",
  "batchSize",
  "listingType",
];

const AGRICULTURAL_NUMERIC_FILTERS = new Set([
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "minTotalArea",
  "maxTotalArea",
  "minRoadWidthFt",
  "minBorewells",
  "maxBorewells",
  "batchSize",
]);

/* -------------------- PUBLIC API -------------------- */

export function sanitizeSearchFilters(req: any): SanitizedResult {
  const category = String(req.query.category).toLowerCase();

  if (!category) {
    throw new Error("Category is required for search");
  }

  let result: SanitizedResult;

  if (category === "residential") {
    result = sanitize(
      req,
      RESIDENTIAL_ALLOWED_FILTERS,
      RESIDENTIAL_NUMERIC_FILTERS,
    );
  } else if (category === "commercial") {
    result = sanitize(
      req,
      COMMERCIAL_ALLOWED_FILTERS,
      COMMERCIAL_NUMERIC_FILTERS,
    );
  } else if (category === "land") {
    result = sanitize(req, LAND_ALLOWED_FILTERS, LAND_NUMERIC_FILTERS);
  } else if (category === "agricultural") {
    result = sanitize(
      req,
      AGRICULTURAL_ALLOWED_FILTERS,
      AGRICULTURAL_NUMERIC_FILTERS,
    );
  } else {
    throw new Error(`Unsupported category: ${category}`);
  }

  // ✅ FORCE category into filter
  result.filter.category = category;

  return result;
}

/* -------------------- CORE SANITIZER -------------------- */

function sanitize(
  req: any,
  allowedKeys: string[],
  numericKeys: Set<string>,
): SanitizedResult {
  const filter: Record<string, any> = {};
  let batchSize = 50;

  for (const key of allowedKeys) {
    const value = req.query[key];

    if (value === undefined || value === null || value === "") continue;

    if (numericKeys.has(key)) {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        filter[key] = num;
      }
    } else {
      filter[key] = String(value);
    }
  }

  if (req.query.batchSize) {
    const num = Number(req.query.batchSize);
    if (!Number.isNaN(num)) {
      batchSize = num;
    }
  }

  return {
    filter,
    batchSize,
  };
}
