import { FilterState } from "@/types/sharedTypes";

function normalizeFilters(obj: Record<string, any>) {
  const out: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    // ✅ ARRAY → CSV STRING
    if (Array.isArray(value)) {
      out[key] = value.join(",");
      return;
    }

    // ✅ RANGE OBJECT → min/max
    if (typeof value === "object") {
      if (value.min != null) out[`min${capitalize(key)}`] = value.min;
      if (value.max != null) out[`max${capitalize(key)}`] = value.max;
      return;
    }

    // ✅ SIMPLE VALUE
    out[key] = value;
  });

  return out;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapCsv(value: unknown, mapFn: (token: string) => string) {
  if (typeof value !== "string") return value;
  return value
    .split(",")
    .map((v) => mapFn(v.trim()))
    .filter(Boolean)
    .join(",");
}

function normalizeCommercialTypeToken(token: string) {
  return token.toLowerCase().replace(/[\s-]+/g, "");
}

function normalizeCommercialSubTypeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeCommercialLabelToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeCommercialFlooringToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "vitrified") return "vitrified-tiles";
  if (normalized === "concrete") return "bare-cement";
  return normalizeCommercialLabelToken(token);
}

function normalizeCommercialWallFinishToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "bare") return "no-partitions";
  if (normalized === "painted") return "plastered-walls";
  if (normalized === "finished") return "plastered-walls";
  return normalizeCommercialLabelToken(token);
}

function normalizeCommercialParkingToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized.includes("visitor")) return "visitorParking";
  if (normalized.includes("2")) return "twoWheeler";
  if (normalized.includes("4")) return "fourWheeler";
  return normalizeCommercialLabelToken(token);
}

function normalizeCommercialFireSafetyToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "fire extinguisher") return "fireExtinguisher";
  if (normalized === "fire sprinkler") return "fireSprinklerSystem";
  if (normalized === "smoke detector") return "smokeDetector";
  if (normalized === "fire alarm") return "fireAlarmSystem";
  if (normalized === "emergency exit") return "emergencyExitSignage";
  return token.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase());
}

function toTrueQueryValue(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : undefined;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "yes" || normalized === "available") {
      return "true";
    }
  }
  return undefined;
}

const LAND_TYPE_LABEL_TO_API: Record<string, string> = {
  "residential plot": "residential-plot",
  "commercial plot": "commercial-plot",
  "industrial plot": "industrial-plot",
  "residential land": "residential-plot",
  "commercial land": "commercial-plot",
  "industrial land": "industrial-plot",
  "farm land": "investment-plot",
  "agricultural land": "na-plot",
};

const LAND_SUBTYPE_LABEL_TO_API: Record<string, string> = {
  "gated community": "gated-community",
  "non gated": "non-gated",
  corner: "corner",
  "road facing": "road-facing",
  "two side open": "two-side-open",
  "three side open": "three-side-open",
  resale: "resale",
  "new plot": "new-plot",
  "open plot": "new-plot",
  "layout plot": "gated-community",
  "corner plot": "corner",
  "dtcp approved plot": "gated-community",
  "hmda approved plot": "gated-community",
};

function normalizeLandTypeToken(token: string) {
  const normalized = token.trim().toLowerCase();
  return LAND_TYPE_LABEL_TO_API[normalized] ?? normalized.replace(/[\s_]+/g, "-");
}

function normalizeLandSubTypeToken(token: string) {
  const normalized = token.trim().toLowerCase();
  return LAND_SUBTYPE_LABEL_TO_API[normalized] ?? normalized.replace(/[\s_]+/g, "-");
}

function normalizeLandFacingToken(token: string) {
  return token.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeAgriculturalTypeToken(token: string) {
  const normalized = token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  const map: Record<string, string> = {
    farmland: "farm-land",
    wetland: "wet-land",
    dryland: "dry-land",
  };

  return map[normalized] ?? normalized;
}

function normalizeAgriculturalSubTypeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeAgriculturalLabelToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeAreaUnitToken(token: string) {
  return token.trim().toLowerCase();
}

function parseMinPlusCsv(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = value
    .split(",")
    .map((token) => Number(token.replace(/[^\d.]/g, "")))
    .filter((num) => Number.isFinite(num));

  if (parsed.length === 0) return undefined;
  return Math.min(...parsed);
}

function normalizeListingSourceToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "owners" || normalized === "owner") return "user";
  if (normalized === "agents" || normalized === "agent") return "agent";
  if (normalized === "builders" || normalized === "builder") return "builder";
  return normalized;
}

function normalizeBedroomToken(token: string) {
  return token.trim() === "6+" ? "6plus" : token.trim();
}

function normalizeResidentialFurnishingToken(token: string) {
  return token.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeResidentialFacingToken(token: string) {
  return token.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseMinPlusToken(token: string) {
  const parsed = Number(token.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildSearchParams(filters: FilterState) {
  const base = {
    category: filters.category,
    listingType: filters.listingTypeValue,
    search: filters.searchText?.trim() || undefined,

    // 🔥 Convert Lakhs → Rupees
    minPrice:
      typeof filters.minPrice === "number"
        ? filters.minPrice * 100000
        : undefined,

    maxPrice:
      typeof filters.maxPrice === "number"
        ? filters.maxPrice * 100000
        : undefined,
  };



  switch (filters.category) {
    case "Residential":
      {
        const normalized = normalizeFilters(filters.residential);

        if (normalized.listingSource !== undefined) {
          normalized.listingSource = mapCsv(
            normalized.listingSource,
            normalizeListingSourceToken
          );
        }

        if (normalized.createdByRole !== undefined) {
          normalized.createdByRole = mapCsv(
            normalized.createdByRole,
            normalizeListingSourceToken
          );
        }

        if (normalized.bedrooms !== undefined) {
          normalized.bedrooms = mapCsv(
            normalized.bedrooms,
            normalizeBedroomToken
          );
        }

        if (normalized.bathroom !== undefined) {
          normalized.bathrooms = normalized.bathroom;
          delete normalized.bathroom;
        }

        if (normalized.balcony !== undefined) {
          normalized.balconies = normalized.balcony;
          delete normalized.balcony;
        }

        if (normalized.minCoveredArea !== undefined) {
          normalized.minCarpetArea = normalized.minCoveredArea;
          delete normalized.minCoveredArea;
        }

        if (normalized.maxCoveredArea !== undefined) {
          normalized.maxCarpetArea = normalized.maxCoveredArea;
          delete normalized.maxCoveredArea;
        }

        if (normalized.parking !== undefined) {
          const parkingValues = String(normalized.parking)
            .split(",")
            .map((token) => parseMinPlusToken(token.trim()))
            .filter((value): value is number => value !== undefined);

          if (parkingValues.length > 0) {
            normalized.minFourWheeler = Math.min(...parkingValues);
          }
          delete normalized.parking;
        }

        if (normalized.furnishing !== undefined) {
          normalized.furnishing = mapCsv(
            normalized.furnishing,
            normalizeResidentialFurnishingToken
          );
        }

        if (normalized.facing !== undefined) {
          normalized.facing = mapCsv(
            normalized.facing,
            normalizeResidentialFacingToken
          );
        }

        if (normalized.createdByRole !== undefined) {
          normalized.createdByRole = mapCsv(
            normalized.createdByRole,
            normalizeListingSourceToken
          );
        }

        return {
          ...base,
          ...normalized,
        };
      }

    case "Commercial":
      {
        const normalized = normalizeFilters(filters.commercial);

        if (normalized.commercialType !== undefined) {
          normalized.propertyType = mapCsv(
            normalized.commercialType,
            normalizeCommercialTypeToken
          );
          delete normalized.commercialType;
        }

        if (normalized.commercialSubType !== undefined) {
          normalized.propertySubType = mapCsv(
            normalized.commercialSubType,
            normalizeCommercialSubTypeToken
          );
          delete normalized.commercialSubType;
        }

        if (normalized.furnishingStatus !== undefined) {
          normalized.furnishedStatus = normalized.furnishingStatus;
          delete normalized.furnishingStatus;
        }

        if (normalized.minBuiltUpArea !== undefined) {
          normalized.minBuiltUpArea = normalized.minBuiltUpArea;
        }

        if (normalized.maxBuiltUpArea !== undefined) {
          normalized.maxBuiltUpArea = normalized.maxBuiltUpArea;
        }

        if (normalized.powerCapacity !== undefined) {
          const powerValues = String(normalized.powerCapacity)
            .split(",")
            .map((token) => parseMinPlusToken(token.trim()))
            .filter((value): value is number => value !== undefined);

          if (powerValues.length > 0) {
            normalized.minPowerCapacityKw = Math.min(...powerValues);
          }
          delete normalized.powerCapacity;
        }

        if (normalized.parking !== undefined) {
          normalized.parking = mapCsv(
            normalized.parking,
            normalizeCommercialParkingToken
          );
        }

        if (normalized.fireSafety !== undefined) {
          normalized.fireSafety = mapCsv(
            normalized.fireSafety,
            normalizeCommercialFireSafetyToken
          );
        }

        if (normalized.flooringType !== undefined) {
          normalized.flooringType = mapCsv(
            normalized.flooringType,
            normalizeCommercialFlooringToken
          );
        }

        if (normalized.wallFinish !== undefined) {
          normalized.wallFinishStatus = mapCsv(
            normalized.wallFinish,
            normalizeCommercialWallFinishToken
          );
          delete normalized.wallFinish;
        }

        if (normalized.pantry !== undefined) {
          const pantry = String(normalized.pantry).trim().toLowerCase();
          if (pantry.includes("inside")) normalized.pantry = "inside";
          else if (pantry.includes("shared")) normalized.pantry = "shared";
        }

        if (normalized.tenantAvailable !== undefined) {
          normalized.tenantAvailable = toTrueQueryValue(normalized.tenantAvailable);
          if (!normalized.tenantAvailable) delete normalized.tenantAvailable;
        }

        const commercialVerified = toTrueQueryValue(normalized.verifiedProperties);
        if (commercialVerified) normalized.verifiedProperties = commercialVerified;
        else delete normalized.verifiedProperties;

        const commercialNegotiable = toTrueQueryValue(normalized.priceNegotiable);
        if (commercialNegotiable) normalized.negotiable = commercialNegotiable;
        delete normalized.priceNegotiable;

        if (normalized.listingSource !== undefined) {
          normalized.listingSource = mapCsv(
            normalized.listingSource,
            normalizeListingSourceToken
          );
        }

        return {
          ...base,
          ...normalized,
        };
      }

    case "Land":
      {
        const normalized = normalizeFilters(filters.land);
        const dimensions = filters.land.dimensions;

        if (normalized.landType !== undefined) {
          normalized.propertyType = mapCsv(
            normalized.landType,
            normalizeLandTypeToken
          );
          delete normalized.landType;
        }

        if (normalized.landSubType !== undefined) {
          normalized.propertySubType = mapCsv(
            normalized.landSubType,
            normalizeLandSubTypeToken
          );
          delete normalized.landSubType;
        }

        if (normalized.approvedBy !== undefined) {
          normalized.approvedByAuthority = normalized.approvedBy;
          delete normalized.approvedBy;
        }

        if (normalized.facing !== undefined) {
          normalized.facing = mapCsv(normalized.facing, normalizeLandFacingToken);
        }

        if (normalized.roadWidth !== undefined) {
          const minRoadWidth = parseMinPlusCsv(normalized.roadWidth);
          if (minRoadWidth !== undefined) {
            normalized.minRoadWidthFt = minRoadWidth;
          }
          delete normalized.roadWidth;
        }

        if (normalized.createdByRole !== undefined) {
          normalized.createdByRole = mapCsv(
            normalized.createdByRole,
            normalizeListingSourceToken
          );
        }

        const cornerPlot = toTrueQueryValue(normalized.cornerPlot);
        if (cornerPlot) normalized.cornerPlot = cornerPlot;
        else delete normalized.cornerPlot;

        const readyToConstruct = toTrueQueryValue(normalized.readyToConstruct);
        if (readyToConstruct) normalized.readyToConstruct = readyToConstruct;
        else delete normalized.readyToConstruct;

        const waterConnection = toTrueQueryValue(normalized.waterConnection);
        if (waterConnection) normalized.waterConnection = waterConnection;
        else delete normalized.waterConnection;

        const electricityConnection = toTrueQueryValue(
          normalized.electricityConnection
        );
        if (electricityConnection) {
          normalized.electricityConnection = electricityConnection;
        } else {
          delete normalized.electricityConnection;
        }

        const negotiable = toTrueQueryValue(normalized.priceNegotiable);
        if (negotiable) normalized.negotiable = negotiable;
        delete normalized.priceNegotiable;

        const verified = toTrueQueryValue(normalized.verifiedProperties);
        if (verified) normalized.verifiedProperties = verified;
        else delete normalized.verifiedProperties;

        if (
          typeof dimensions?.length === "number" &&
          Number.isFinite(dimensions.length)
        ) {
          normalized.minDimensionLength = dimensions.length;
        }
        if (
          typeof dimensions?.width === "number" &&
          Number.isFinite(dimensions.width)
        ) {
          normalized.minDimensionWidth = dimensions.width;
        }

        return {
          ...base,
          ...normalized,
        };
      }

    case "Agricultural":
      {
        const normalized = normalizeFilters(filters.agricultural);

        if (normalized.agriculturalType !== undefined) {
          normalized.propertyType = mapCsv(
            normalized.agriculturalType,
            normalizeAgriculturalTypeToken
          );
          delete normalized.agriculturalType;
        }

        if (normalized.agriculturalSubType !== undefined) {
          normalized.propertySubType = mapCsv(
            normalized.agriculturalSubType,
            normalizeAgriculturalSubTypeToken
          );
          delete normalized.agriculturalSubType;
        }

        if (normalized.minTotalArea !== undefined) {
          normalized.minArea = normalized.minTotalArea;
          delete normalized.minTotalArea;
        }

        if (normalized.maxTotalArea !== undefined) {
          normalized.maxArea = normalized.maxTotalArea;
          delete normalized.maxTotalArea;
        }

        if (normalized.areaUnit !== undefined) {
          normalized.areaUnit = mapCsv(normalized.areaUnit, normalizeAreaUnitToken);
        }

        if (normalized.soilType !== undefined) {
          normalized.soilType = mapCsv(
            normalized.soilType,
            normalizeAgriculturalLabelToken
          );
        }

        if (normalized.irrigationType !== undefined) {
          normalized.irrigationType = mapCsv(
            normalized.irrigationType,
            normalizeAgriculturalLabelToken
          );
        }

        if (normalized.waterSource !== undefined) {
          normalized.waterSource = mapCsv(
            normalized.waterSource,
            normalizeAgriculturalLabelToken
          );
        }

        if (normalized.currentCrop !== undefined) {
          normalized.currentCrop = mapCsv(
            normalized.currentCrop,
            normalizeAgriculturalLabelToken
          );
        }

        if (normalized.accessRoadType !== undefined) {
          normalized.accessRoadType = mapCsv(
            normalized.accessRoadType,
            normalizeAgriculturalLabelToken
          );
        }

        if (normalized.plantationAge !== undefined) {
          const minPlantationAge = parseMinPlusCsv(normalized.plantationAge);
          if (minPlantationAge !== undefined) {
            normalized.minPlantationAge = minPlantationAge;
          }
          delete normalized.plantationAge;
        }

        if (normalized.roadWidth !== undefined) {
          const minRoadWidth = parseMinPlusCsv(normalized.roadWidth);
          if (minRoadWidth !== undefined) {
            normalized.minRoadWidthFt = minRoadWidth;
          }
          delete normalized.roadWidth;
        }

        if (normalized.stateRestrictions !== undefined) {
          if (typeof normalized.stateRestrictions === "boolean") {
            normalized.statePurchaseRestrictions = normalized.stateRestrictions
              ? "applicable"
              : "not-applicable";
          } else {
            const token = String(normalized.stateRestrictions).trim().toLowerCase();
            normalized.statePurchaseRestrictions =
              token === "true" || token === "applicable"
                ? "applicable"
                : "not-applicable";
          }
          delete normalized.stateRestrictions;
        }

        if (normalized.createdByRole !== undefined) {
          normalized.createdByRole = mapCsv(
            normalized.createdByRole,
            normalizeListingSourceToken
          );
        }

        const electricityConnection = toTrueQueryValue(
          normalized.electricityConnection
        );
        if (electricityConnection) {
          normalized.electricityConnection = electricityConnection;
        } else {
          delete normalized.electricityConnection;
        }

        const boundaryWall = toTrueQueryValue(normalized.boundaryWall);
        if (boundaryWall) normalized.boundaryWall = boundaryWall;
        else delete normalized.boundaryWall;

        const negotiable = toTrueQueryValue(normalized.priceNegotiable);
        if (negotiable) normalized.negotiable = negotiable;
        delete normalized.priceNegotiable;

        const verified = toTrueQueryValue(normalized.verifiedProperties);
        if (verified) normalized.verifiedProperties = verified;
        else delete normalized.verifiedProperties;

        return {
          ...base,
          ...normalized,
        };
      }

    default:
      return base;
  }
}
