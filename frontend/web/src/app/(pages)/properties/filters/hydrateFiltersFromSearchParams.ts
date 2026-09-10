import type {
  AgriculturalFilters,
  BedroomFilterValue,
  CommercialFilters,
  LandFilters,
  ResidentialFilters,
} from "@/types/sharedTypes";
import type { categoryOption } from "@/Redux/slice/filterSlice";
import { normalizeFilterValue } from "./filterValueUtils";

type HydratedFilters = {
  category?: categoryOption;
  listingType?: "sale" | "rent" | "lease";
  searchText: string;
  minPrice: number | null;
  maxPrice: number | null;
  residential: ResidentialFilters;
  commercial: CommercialFilters;
  land: LandFilters;
  agricultural: AgriculturalFilters;
};

function getString(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function getCsv(params: URLSearchParams, key: string) {
  const value = getString(params, key);
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function uniqueValues(values: string[] | undefined) {
  if (!values) return undefined;

  const unique = values.filter(
    (value, index, source) => source.indexOf(value) === index,
  );

  return unique.length > 0 ? unique : undefined;
}

function normalizeResidentialFurnishingValue(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeResidentialFacingValues(values: string[] | undefined) {
  return uniqueValues(
    values
      ?.map((value) => value.trim().toLowerCase().replace(/[\s_-]+/g, ""))
      .filter(Boolean),
  );
}

function normalizeFilterValues(key: string, values: string[] | undefined) {
  return uniqueValues(
    values
      ?.map((value) => normalizeFilterValue(key, value))
      .filter(Boolean),
  );
}

function normalizeFilterString(key: string, value: string | undefined) {
  return value ? normalizeFilterValue(key, value) : undefined;
}

function getNumber(params: URLSearchParams, key: string) {
  const value = getString(params, key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getBoolean(params: URLSearchParams, key: string) {
  const value = getString(params, key)?.toLowerCase();
  if (!value) return undefined;
  if (["true", "yes", "available", "applicable", "1"].includes(value)) return true;
  if (["false", "no", "not-applicable", "0"].includes(value)) return false;
  return undefined;
}

function getPriceInLakhs(params: URLSearchParams, key: string) {
  const value = getNumber(params, key);
  if (value === undefined) return null;
  return value / 100000;
}

function getBedroomValues(params: URLSearchParams) {
  const values = getCsv(params, "bedrooms");
  if (!values) return undefined;

  const parsed = values
    .map((value) => {
      if (value === "6plus" || value === "6+") return "6+" as const;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    })
    .filter((value): value is BedroomFilterValue => value !== undefined);

  return parsed.length > 0 ? parsed : undefined;
}

function getCategory(params: URLSearchParams): categoryOption | undefined {
  const raw = (
    getString(params, "category") ??
    getString(params, "type")
  )?.toLowerCase();

  switch (raw) {
    case "residential":
      return "Residential";
    case "commercial":
      return "Commercial";
    case "land":
    case "plot":
      return "Land";
    case "agricultural":
      return "Agricultural";
    default:
      return undefined;
  }
}

function getListingType(params: URLSearchParams) {
  const value = getString(params, "listingType")?.toLowerCase();
  if (value === "sale" || value === "rent" || value === "lease") {
    return value;
  }
  return undefined;
}

export function hydrateFiltersFromSearchParams(
  params: URLSearchParams,
): HydratedFilters {
  const residential: ResidentialFilters = {};
  const commercial: CommercialFilters = {};
  const land: LandFilters = {};
  const agricultural: AgriculturalFilters = {};

  const locality = getCsv(params, "locality");
  const createdByRole =
    getString(params, "createdByRole") ??
    getString(params, "postedBy") ??
    getString(params, "postedby");

  const listingSource = getString(params, "listingSource");

  residential.propertyType = getCsv(params, "propertyType");
  residential.transactionType = getString(params, "transactionType");
  residential.constructionStatus = getString(params, "constructionStatus");
  residential.furnishing = normalizeResidentialFurnishingValue(
    getString(params, "furnishing"),
  );
  residential.postedSince = getString(params, "postedSince");
  residential.listingSource = listingSource;
  residential.createdByRole = createdByRole;
  residential.bathroom = getCsv(params, "bathrooms");
  residential.balcony = getCsv(params, "balconies");
  residential.amenities = getCsv(params, "amenities");
  residential.facing = normalizeResidentialFacingValues(getCsv(params, "facing"));
  residential.locality = locality;
  residential.bedrooms = getBedroomValues(params);
  residential.verifiedOnly = getBoolean(params, "verifiedOnly");

  const minCarpetArea = getNumber(params, "minCarpetArea");
  const maxCarpetArea = getNumber(params, "maxCarpetArea");
  if (minCarpetArea !== undefined || maxCarpetArea !== undefined) {
    residential.coveredArea = {
      min: minCarpetArea,
      max: maxCarpetArea,
    };
  }

  const minResidentialParking = getNumber(params, "minFourWheeler");
  residential.parking =
    getCsv(params, "parking") ??
    (minResidentialParking !== undefined ? [String(minResidentialParking)] : undefined);

  commercial.commercialType = normalizeFilterValues(
    "commercialType",
    getCsv(params, "propertyType"),
  );
  commercial.commercialSubType = normalizeFilterValues(
    "commercialSubType",
    getCsv(params, "propertySubType"),
  );
  commercial.transactionType = normalizeFilterString(
    "transactionType",
    getString(params, "transactionType"),
  );
  commercial.constructionStatus = normalizeFilterString(
    "constructionStatus",
    getString(params, "constructionStatus"),
  );
  commercial.floorNumber = getCsv(params, "floorNumber");
  commercial.totalFloors = getCsv(params, "totalFloors");
  commercial.furnishingStatus = normalizeFilterString(
    "furnishingStatus",
    getString(params, "furnishedStatus"),
  );
  commercial.pantry = normalizeFilterString("pantry", getString(params, "pantry"));
  commercial.parking =
    getCsv(params, "parking") ??
    normalizeFilterString("parking", getString(params, "parking"));
  commercial.fireSafety = normalizeFilterValues("fireSafety", getCsv(params, "fireSafety"));
  commercial.flooringType = normalizeFilterValues(
    "flooringType",
    getCsv(params, "flooringType"),
  );
  commercial.wallFinish = normalizeFilterValues(
    "wallFinish",
    getCsv(params, "wallFinishStatus"),
  );
  commercial.tenantAvailable =
    getBoolean(params, "tenantAvailable") === true ? "true" : undefined;
  commercial.banksApproved = getCsv(params, "banksApproved");
  commercial.priceNegotiable =
    getBoolean(params, "negotiable") === true ? "true" : undefined;
  commercial.verifiedProperties = getBoolean(params, "verifiedProperties");
  commercial.amenities = getCsv(params, "amenities");
  commercial.postedSince = getString(params, "postedSince");
  commercial.listingSource = listingSource;
  commercial.createdByRole = createdByRole;
  commercial.locality = locality;

  const minBuiltUpArea = getNumber(params, "minBuiltUpArea");
  const maxBuiltUpArea = getNumber(params, "maxBuiltUpArea");
  if (minBuiltUpArea !== undefined || maxBuiltUpArea !== undefined) {
    commercial.builtUpArea = {
      min: minBuiltUpArea,
      max: maxBuiltUpArea,
    };
  }

  const minCommercialCarpetArea = getNumber(params, "minCarpetArea");
  const maxCommercialCarpetArea = getNumber(params, "maxCarpetArea");
  if (minCommercialCarpetArea !== undefined || maxCommercialCarpetArea !== undefined) {
    commercial.carpetArea = {
      min: minCommercialCarpetArea,
      max: maxCommercialCarpetArea,
    };
  }

  const minPowerCapacityKw = getNumber(params, "minPowerCapacityKw");
  commercial.powerCapacity =
    normalizeFilterValues("powerCapacity", getCsv(params, "powerCapacity")) ??
    (minPowerCapacityKw !== undefined
      ? [normalizeFilterValue("powerCapacity", String(minPowerCapacityKw))]
      : undefined);

  land.landType = normalizeFilterValues("landType", getCsv(params, "propertyType"));
  land.landSubType = normalizeFilterValues(
    "landSubType",
    getCsv(params, "propertySubType"),
  );
  land.plotAreaUnit = normalizeFilterValues(
    "plotAreaUnit",
    getCsv(params, "plotAreaUnit"),
  ) as LandFilters["plotAreaUnit"];
  land.roadWidth =
    normalizeFilterValues("roadWidth", getCsv(params, "roadWidth")) ??
    (getNumber(params, "minRoadWidthFt") !== undefined
      ? [normalizeFilterValue("roadWidth", String(getNumber(params, "minRoadWidthFt")))]
      : undefined);
  land.facing = normalizeFilterValues("facing", getCsv(params, "facing"));
  land.cornerPlot = getBoolean(params, "cornerPlot");
  land.readyToConstruct = getBoolean(params, "readyToConstruct");
  land.waterConnection = getBoolean(params, "waterConnection");
  land.electricityConnection = getBoolean(params, "electricityConnection");
  land.approvedBy = getCsv(params, "approvedByAuthority");
  land.landUseZone = getCsv(params, "landUseZone");
  land.banksApproved = getCsv(params, "banksApproved");
  land.priceNegotiable = getBoolean(params, "negotiable");
  land.verifiedProperties = getBoolean(params, "verifiedProperties");
  land.amenities = getCsv(params, "amenities");
  land.postedSince = getString(params, "postedSince");
  land.createdByRole = createdByRole;
  land.locality = locality;

  const minPlotArea = getNumber(params, "minPlotArea");
  const maxPlotArea = getNumber(params, "maxPlotArea");
  if (minPlotArea !== undefined || maxPlotArea !== undefined) {
    land.plotArea = {
      min: minPlotArea,
      max: maxPlotArea,
    };
  }

  const minDimensionLength = getNumber(params, "minDimensionLength");
  const minDimensionWidth = getNumber(params, "minDimensionWidth");
  if (minDimensionLength !== undefined || minDimensionWidth !== undefined) {
    land.dimensions = {
      length: minDimensionLength,
      width: minDimensionWidth,
    };
  }

  agricultural.agriculturalType = normalizeFilterValues(
    "agriculturalType",
    getCsv(params, "propertyType"),
  );
  agricultural.agriculturalSubType = normalizeFilterValues(
    "agriculturalSubType",
    getCsv(params, "propertySubType"),
  );
  agricultural.areaUnit = normalizeFilterString(
    "areaUnit",
    getString(params, "areaUnit"),
  ) as AgriculturalFilters["areaUnit"];
  agricultural.soilType = normalizeFilterValues("soilType", getCsv(params, "soilType"));
  agricultural.irrigationType = normalizeFilterValues(
    "irrigationType",
    getCsv(params, "irrigationType"),
  );
  agricultural.waterSource = normalizeFilterValues(
    "waterSource",
    getCsv(params, "waterSource"),
  );
  agricultural.borewellCount = normalizeFilterValues(
    "borewellCount",
    getCsv(params, "borewellCount"),
  );
  agricultural.electricityConnection = getBoolean(params, "electricityConnection");
  agricultural.roadWidth =
    normalizeFilterValues("roadWidth", getCsv(params, "roadWidth")) ??
    (getNumber(params, "minRoadWidthFt") !== undefined
      ? [String(getNumber(params, "minRoadWidthFt"))]
      : undefined);
  agricultural.accessRoadType = normalizeFilterValues(
    "accessRoadType",
    getCsv(params, "accessRoadType"),
  );
  agricultural.boundaryWall = getBoolean(params, "boundaryWall");
  agricultural.currentCrop = normalizeFilterValues(
    "currentCrop",
    getCsv(params, "currentCrop"),
  );
  agricultural.plantationAge =
    normalizeFilterValues("plantationAge", getCsv(params, "plantationAge")) ??
    (getNumber(params, "minPlantationAge") !== undefined
      ? [normalizeFilterValue("plantationAge", String(getNumber(params, "minPlantationAge")))]
      : undefined);
  agricultural.stateRestrictions = getString(params, "statePurchaseRestrictions") === "applicable";
  agricultural.priceNegotiable = getBoolean(params, "negotiable");
  agricultural.verifiedProperties = getBoolean(params, "verifiedProperties");
  agricultural.amenities = getCsv(params, "amenities");
  agricultural.postedSince = getString(params, "postedSince");
  agricultural.createdByRole = createdByRole;
  agricultural.locality = locality;

  const minArea = getNumber(params, "minArea");
  const maxArea = getNumber(params, "maxArea");
  if (minArea !== undefined || maxArea !== undefined) {
    agricultural.totalArea = {
      min: minArea,
      max: maxArea,
    };
  }

  return {
    category: getCategory(params),
    listingType: getListingType(params),
    searchText: params.get("search") ?? "",
    minPrice: getPriceInLakhs(params, "minPrice"),
    maxPrice: getPriceInLakhs(params, "maxPrice"),
    residential,
    commercial,
    land,
    agricultural,
  };
}
