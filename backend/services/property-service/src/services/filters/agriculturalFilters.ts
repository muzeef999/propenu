import type { Request } from "express";
import { AgriculturalQuery, BaseFilters } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

function parseCsv(value?: string) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function isTruthy(value: unknown) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "available" ||
    normalized === "1"
  );
}

function parseMinPlusOption(value?: string) {
  const options = parseCsv(value);
  if (options.length === 0) return undefined;

  const parsed = options
    .map((token) => Number(token.replace(/[^\d.]/g, "")))
    .filter((n) => Number.isFinite(n));

  if (parsed.length === 0) return undefined;
  return Math.min(...parsed);
}

function normalizeListingSourceToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (
    normalized === "owners" ||
    normalized === "owner" ||
    normalized === "user"
  ) {
    return "owner,user";
  }
  if (normalized === "agents" || normalized === "agent") return "agent";
  if (normalized === "builders" || normalized === "builder") return "builder";
  return normalized;
}

function normalizeRestrictionToken(value?: string) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (normalized === "true" || normalized === "applicable") return "applicable";
  if (
    normalized === "false" ||
    normalized === "not-applicable" ||
    normalized === "notapplicable"
  ) {
    return "not-applicable";
  }
  return undefined;
}

function getPostedSinceDate(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all") return undefined;

  const daysByLabel: Record<string, number> = {
    yesterday: 1,
    "last week": 7,
    "last month": 30,
    "last 3 months": 90,
  };

  const days = daysByLabel[normalized];
  if (!days) return undefined;

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function extendAgriculturalFilters(
  query: AgriculturalQuery = {},
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  f.status = "active";
  const q = query ?? {};

  const and: any[] = [];

  /* ---------------- SEARCH (title) ---------------- */
  if (typeof q.search === "string" && q.search.trim()) {
    const words = q.search.trim().split(/\s+/);
    for (const word of words) {
      and.push({
        title: { $regex: word, $options: "i" },
      });
    }
  }
  if (typeof q.listingType === "string") {
    f.listingType = q.listingType.toLowerCase();
  }

  /* ---------------- CITY (SAFE) ---------------- */
  if (q.city) {
    and.push({
      $or: [
        { city: q.city },
        { title: { $regex: q.city, $options: "i" } },
      ],
    });
  }

  /* ---------------- LOCALITY (SAFE) ---------------- */
  if (typeof q.locality === "string" && q.locality.trim()) {
    const localities = q.locality.split(",").map(l => l.trim());

    and.push({
      $or: [
        { locality: { $in: localities } },
        { title: { $regex: localities.join("|"), $options: "i" } },
      ],
    });
  }

  /* ---------------- PRICE ---------------- */
  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price: any = {};
    if (minPrice !== undefined && maxPrice !== undefined) {
      price.$gte = Math.min(minPrice, maxPrice);
      price.$lte = Math.max(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      price.$gte = minPrice;
    } else if (maxPrice !== undefined) {
      price.$lte = maxPrice;
    }
    and.push({ price });
  }

  /* ---------------- AREA ---------------- */
  const minArea = parseNumber(q.minArea) ?? parseNumber(q.minTotalArea);
  const maxArea = parseNumber(q.maxArea) ?? parseNumber(q.maxTotalArea);

  if (minArea !== undefined || maxArea !== undefined) {
    const area: any = {};
    if (minArea !== undefined) area.$gte = minArea;
    if (maxArea !== undefined) area.$lte = maxArea;
    and.push({ "totalArea.value": area });
  }

  const areaUnits = parseCsv(q.areaUnit as string | undefined).map((unit) => unit.toLowerCase());
  if (areaUnits.length === 1) and.push({ "totalArea.unit": areaUnits[0] });
  else if (areaUnits.length > 1) {
    and.push({ "totalArea.unit": { $in: areaUnits } });
  }

  /* ---------------- SOIL / IRRIGATION ---------------- */
  const soilTypes = parseCsv(q.soilType as string | undefined);
  if (soilTypes.length === 1) and.push({ soilType: soilTypes[0] });
  else if (soilTypes.length > 1) and.push({ soilType: { $in: soilTypes } });

  const irrigationTypes = parseCsv(q.irrigationType as string | undefined);
  if (irrigationTypes.length === 1) {
    and.push({ irrigationType: irrigationTypes[0] });
  } else if (irrigationTypes.length > 1) {
    and.push({ irrigationType: { $in: irrigationTypes } });
  }

  const waterSources = parseCsv(q.waterSource as string | undefined);
  if (waterSources.length === 1) and.push({ waterSource: waterSources[0] });
  else if (waterSources.length > 1) {
    and.push({ waterSource: { $in: waterSources } });
  }

  const accessRoadTypes = parseCsv(q.accessRoadType as string | undefined);
  if (accessRoadTypes.length === 1) {
    and.push({ accessRoadType: accessRoadTypes[0] });
  } else if (accessRoadTypes.length > 1) {
    and.push({ accessRoadType: { $in: accessRoadTypes } });
  }

  const currentCrops = parseCsv(q.currentCrop as string | undefined);
  if (currentCrops.length === 1) and.push({ currentCrop: currentCrops[0] });
  else if (currentCrops.length > 1) {
    and.push({ currentCrop: { $in: currentCrops } });
  }

  const minPlantationAge =
    parseNumber(q.minPlantationAge) ??
    parseMinPlusOption(q.plantationAge as string | undefined);
  if (minPlantationAge !== undefined) {
    and.push({ plantationAge: { $gte: minPlantationAge } });
  }

  const propertyTypes = parseCsv(q.propertyType as string | undefined);
  if (propertyTypes.length === 1) and.push({ propertyType: propertyTypes[0] });
  else if (propertyTypes.length > 1) {
    and.push({ propertyType: { $in: propertyTypes } });
  }

  const propertySubTypes = parseCsv(q.propertySubType as string | undefined);
  if (propertySubTypes.length === 1) {
    and.push({ propertySubType: propertySubTypes[0] });
  } else if (propertySubTypes.length > 1) {
    and.push({ propertySubType: { $in: propertySubTypes } });
  }

  /* ---------------- BOREWELLS ---------------- */
  const minBore =
    parseNumber(q.minBorewells) ?? parseMinPlusOption(q.borewellCount as string | undefined);
  const maxBore = parseNumber(q.maxBorewells);

  if (minBore !== undefined || maxBore !== undefined) {
    const bw: any = {};
    if (minBore !== undefined) bw.$gte = minBore;
    if (maxBore !== undefined) bw.$lte = maxBore;
    and.push({ numberOfBorewells: bw });
  }

  const minRoadWidth =
    parseNumber(q.minRoadWidthFt) ?? parseMinPlusOption(q.roadWidth as string | undefined);
  if (minRoadWidth !== undefined) {
    and.push({ "roadWidth.value": { $gte: minRoadWidth } });
  }

  const listingSourceTokens = parseCsv(
    (q.listingSource ?? q.postedBy) as string | undefined
  )
    .reduce<string[]>(
      (acc, token) => acc.concat(normalizeListingSourceToken(token).split(",")),
      []
    )
    .map((token) => token.trim())
    .filter(Boolean);
  if (listingSourceTokens.length === 1) {
    and.push({ listingSource: listingSourceTokens[0] });
  } else if (listingSourceTokens.length > 1) {
    and.push({ listingSource: { $in: listingSourceTokens } });
  }

  if (isTruthy(q.electricityConnection)) and.push({ electricityConnection: true });
  if (isTruthy(q.boundaryWall)) and.push({ boundaryWall: true });

  if (isTruthy(q.negotiable)) and.push({ isPriceNegotiable: true });
  if (isTruthy(q.verifiedProperties)) {
    and.push({ "verificationDocuments.status": "verified" });
  }

  const postedSinceDate = getPostedSinceDate(q.postedSince);
  if (postedSinceDate) {
    and.push({ createdAt: { $gte: postedSinceDate } });
  }

  const stateRestriction = normalizeRestrictionToken(
    (q.statePurchaseRestrictions ?? q.stateRestrictions) as string | undefined
  );
  if (stateRestriction === "applicable") {
    and.push({
      statePurchaseRestrictions: { $in: ["Applicable", "applicable"] },
    });
  } else if (stateRestriction === "not-applicable") {
    and.push({
      statePurchaseRestrictions: {
        $in: [
          "Not Applicable",
          "not applicable",
          "Not-Applicable",
          "not-applicable",
        ],
      },
    });
  }

  if (and.length) f.$and = and;

  return f;
}
