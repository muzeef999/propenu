import { BaseFilters, LandQuery } from "../../types/filterTypes";
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

function normalizeListingSourceToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "owners" || normalized === "owner") return "user";
  if (normalized === "agents" || normalized === "agent") return "agent";
  if (normalized === "builders" || normalized === "builder") return "builder";
  return normalized;
}

function parseMinRoadWidth(value?: string) {
  const options = parseCsv(value);
  if (options.length === 0) return undefined;

  const parsed = options
    .map((token) => Number(token.replace(/[^\d.]/g, "")))
    .filter((n) => Number.isFinite(n));

  if (parsed.length === 0) return undefined;
  return Math.min(...parsed);
}

function getPostedSinceDate(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all") return undefined;

  const daysByLabel: Record<string, number> = {
    yesterday: 1,
    "last week": 7,
    "last 2 weeks": 14,
    "last month": 30,
    "last 3 months": 90,
  };

  const days = daysByLabel[normalized];
  if (!days) return undefined;

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function extendLandFilters(
  query: LandQuery = {},
  baseFilter: Partial<BaseFilters> = {},
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  f.status = "active";

  const q = query ?? {};

  if (typeof q.search === "string" && q.search.trim().length > 0) {
    const words = q.search
      .split(/\s+/) // handles multiple spaces safely
      .map((word: string) => word.trim())
      .filter(Boolean);

    f.$and = words.map((word) => ({
      title: { $regex: word, $options: "i" },
    }));
  }

  if (q.city) {
    f.city = q.city;
  }
  if (q.listingType) {
  f.listingType = q.listingType;
}


  if (typeof q.locality === "string" && q.locality.trim().length > 0) {
    const localities = q.locality.split(",");
    if (localities.length === 1) f.locality = localities[0];
    else if (localities.length > 1) f.locality = { $in: localities };
  }

  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};

    if (minPrice !== undefined && maxPrice !== undefined) {
      f.price.$gte = Math.min(minPrice, maxPrice);
      f.price.$lte = Math.max(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      f.price.$gte = minPrice;
    } else {
      f.price.$lte = maxPrice;
    }
  }

  const minPlot = parseNumber(q.minPlotArea);
  const maxPlot = parseNumber(q.maxPlotArea);
  const minDimensionLength = parseNumber(q.minDimensionLength);
  const minDimensionWidth = parseNumber(q.minDimensionWidth);
  const plotUnit = (q.plotAreaUnit as string | undefined)?.trim();

  if (minPlot !== undefined || maxPlot !== undefined) {
    f.plotArea = {};
    if (minPlot !== undefined) f.plotArea.$gte = minPlot;
    if (maxPlot !== undefined) f.plotArea.$lte = maxPlot;
  }

  if (plotUnit) f.plotAreaUnit = plotUnit;
  if (minDimensionLength !== undefined) {
    f["dimensions.length"] = { $gte: minDimensionLength };
  }
  if (minDimensionWidth !== undefined) {
    f["dimensions.width"] = { $gte: minDimensionWidth };
  }

  const typeList = parseCsv((q.propertyType ?? q.landType) as string | undefined);
  if (typeList.length === 1) f.propertyType = typeList[0];
  else if (typeList.length > 1) f.propertyType = { $in: typeList };

  const subTypeList = parseCsv(
    (q.propertySubType ?? q.landSubType) as string | undefined
  );
  if (subTypeList.length === 1) f.propertySubType = subTypeList[0];
  else if (subTypeList.length > 1) f.propertySubType = { $in: subTypeList };

  const facingList = parseCsv(q.facing as string | undefined);
  if (facingList.length === 1) f.facing = facingList[0];
  else if (facingList.length > 1) f.facing = { $in: facingList };

  const minRoadWidth =
    parseNumber(q.minRoadWidthFt as string | undefined) ??
    parseMinRoadWidth(q.roadWidth as string | undefined);
  if (minRoadWidth !== undefined) f.roadWidthFt = { $gte: minRoadWidth };

  const approvedByList = parseCsv(
    (q.approvedByAuthority ?? q.approvedBy) as string | undefined
  );
  if (approvedByList.length === 1) {
    f.approvedByAuthority = approvedByList[0];
  } else if (approvedByList.length > 1) {
    f.approvedByAuthority = { $in: approvedByList };
  }

  const landUseZoneList = parseCsv(q.landUseZone as string | undefined);
  if (landUseZoneList.length === 1) f.landUseZone = landUseZoneList[0];
  else if (landUseZoneList.length > 1) f.landUseZone = { $in: landUseZoneList };

  const banksApprovedList = parseCsv(q.banksApproved as string | undefined);
  if (banksApprovedList.length > 0) f.banksApproved = { $in: banksApprovedList };

  const sourceTokens = parseCsv(
    (q.listingSource ?? q.postedBy) as string | undefined
  ).map(normalizeListingSourceToken);
  if (sourceTokens.length === 1) f.listingSource = sourceTokens[0];
  else if (sourceTokens.length > 1) f.listingSource = { $in: sourceTokens };

  if (isTruthy(q.negotiable)) f.isPriceNegotiable = true;
  if (isTruthy(q.cornerPlot)) f.cornerPlot = true;
  if (isTruthy(q.readyToConstruct)) f.readyToConstruct = true;
  if (isTruthy(q.waterConnection)) f.waterConnection = true;
  if (isTruthy(q.electricityConnection)) f.electricityConnection = true;

  if (isTruthy(q.verifiedProperties)) {
    f["verificationDocuments.status"] = "verified";
  }

  const postedSinceDate = getPostedSinceDate(q.postedSince);
  if (postedSinceDate) {
    f.createdAt = { $gte: postedSinceDate };
  }

  return f;
}
