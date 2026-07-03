import { BaseFilters, CommercialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

type NumericMode = "eq" | "gte";

type NumericCondition = {
  mode: NumericMode;
  value: number;
};

function pushAndCondition(filter: Record<string, any>, condition: Record<string, any>) {
  if (!condition || Object.keys(condition).length === 0) return;
  if (!Array.isArray(filter.$and)) filter.$and = [];
  filter.$and.push(condition);
}

function parseNumericToken(
  raw: string,
  options?: { allowGround?: boolean },
): NumericCondition | undefined {
  const token = raw.trim().toLowerCase();
  if (!token) return undefined;

  if (options?.allowGround && token === "ground") {
    return { mode: "eq", value: 0 };
  }

  const gteMatch = token.match(/^(\d+)\+$/);
  if (gteMatch?.[1]) {
    return { mode: "gte", value: Number(gteMatch[1]) };
  }

  const eqMatch = token.match(/^\d+$/);
  if (eqMatch) {
    return { mode: "eq", value: Number(token) };
  }

  return undefined;
}

function parseNumericSelector(
  input: unknown,
  options?: { allowGround?: boolean },
): NumericCondition[] {
  if (input === undefined || input === null || input === "") return [];

  const raw =
    typeof input === "number"
      ? String(input)
      : typeof input === "string"
        ? input
        : "";

  if (!raw) return [];

  const conditions = raw
    .split(",")
    .map((item) => parseNumericToken(item, options))
    .filter((item): item is NumericCondition => Boolean(item));

  return conditions;
}

function applyNumericSelector(
  filter: Record<string, any>,
  field: string,
  conditions: NumericCondition[],
) {
  if (!conditions.length) return;

  const clauses = conditions.map((condition) =>
    condition.mode === "eq"
      ? { [field]: condition.value }
      : { [field]: { $gte: condition.value } },
  );

  if (clauses.length === 1) {
    const clause = clauses[0];
    if (clause) pushAndCondition(filter, clause);
    return;
  }

  pushAndCondition(filter, { $or: clauses });
}

function isTruthy(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "available";
}

function parseCsv(value: unknown) {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function applyCsvSelector(filter: Record<string, any>, field: string, value: unknown) {
  const values = parseCsv(value);
  if (values.length === 1) filter[field] = values[0];
  else if (values.length > 1) filter[field] = { $in: values };
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

function normalizeCreatedByRoleToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "owner" || normalized === "owners" || normalized === "user") {
    return "user";
  }
  if (normalized === "agent" || normalized === "agents") return "agent";
  if (normalized === "builder" || normalized === "builders") return "builder";
  return normalized;
}

export function extendCommercialFilters(
  query: CommercialQuery = {},
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

    f.$and = words.map((word: string) => ({
      title: { $regex: word, $options: "i" },
    }));
  }

  if (q.city) {
    f.city = q.city;
  }

if (typeof q.locality === "string" && q.locality.trim().length > 0) {
    const localities = q.locality
      .split(",")
      .map((loc) => loc.trim())
      .filter(Boolean);

    if (localities.length === 1) f.locality = localities[0];
    else if (localities.length > 1) f.locality = { $in: localities };
  }

  if (q.listingType) {
    f.listingType = q.listingType;
  }

  if (
    typeof q.createdByRole === "string" &&
    q.createdByRole.trim().length > 0
  ) {
    const roles = q.createdByRole
      .split(",")
      .map((src) => normalizeCreatedByRoleToken(src))
      .filter(Boolean);

    if (roles.length === 1) f["createdBy.roleName"] = roles[0];
    else if (roles.length > 1) f["createdBy.roleName"] = { $in: roles };
  }

  if (
    typeof q.listingSource === "string" &&
    q.listingSource.trim().length > 0
  ) {
    const sources = q.listingSource
      .split(",")
      .map((src) => src.trim())
      .filter(Boolean);

    if (sources.length === 1) f.listingSource = sources[0];
    else if (sources.length > 1) f.listingSource = { $in: sources };
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

  const minBuiltUpArea = parseNumber(q.minBuiltUpArea);
  const maxBuiltUpArea = parseNumber(q.maxBuiltUpArea);

  if (minBuiltUpArea !== undefined || maxBuiltUpArea !== undefined) {
    f.builtUpArea = {};

    if (minBuiltUpArea !== undefined && maxBuiltUpArea !== undefined) {
      f.builtUpArea.$gte = Math.min(minBuiltUpArea, maxBuiltUpArea);
      f.builtUpArea.$lte = Math.max(minBuiltUpArea, maxBuiltUpArea);
    } else if (minBuiltUpArea !== undefined) {
      f.builtUpArea.$gte = minBuiltUpArea;
    } else {
      f.builtUpArea.$lte = maxBuiltUpArea;
    }
  }

  const minArea = parseNumber(q.minCarpetArea);
  const maxArea = parseNumber(q.maxCarpetArea);

  if (minArea !== undefined || maxArea !== undefined) {
    f.carpetArea = {};

    if (minArea !== undefined && maxArea !== undefined) {
      f.carpetArea.$gte = Math.min(minArea, maxArea);
      f.carpetArea.$lte = Math.max(minArea, maxArea);
    } else if (minArea !== undefined) {
      f.carpetArea.$gte = minArea;
    } else {
      f.carpetArea.$lte = maxArea;
    }
  }


  const floorNumberConditions = parseNumericSelector(
    q.floorNumber ?? q.floor,
    { allowGround: true },
  );

  const totalFloorsConditions = parseNumericSelector(q.totalFloors);

  // Backward compatibility for callers that still pass plain numbers.
  const floorNumber = parseNumber(q.floorNumber ?? q.floor);
  const totalFloors = parseNumber(q.totalFloors);

  if (floorNumberConditions.length > 0) {
    applyNumericSelector(f, "floorNumber", floorNumberConditions);
  } else if (floorNumber !== undefined) {
    f.floorNumber = floorNumber;
  }

  if (totalFloorsConditions.length > 0) {
    applyNumericSelector(f, "totalFloors", totalFloorsConditions);
  } else if (totalFloors !== undefined) {
    f.totalFloors = totalFloors;
  }

  if (q.furnishedStatus) {
    f.furnishedStatus = q.furnishedStatus;
  }

  if (q.powerBackup) {
    f.powerBackup = q.powerBackup;
  }

  const minPower = parseNumber(q.minPowerCapacityKw);
  const maxPower = parseNumber(q.maxPowerCapacityKw);

 if (minPower !== undefined || maxPower !== undefined) {
  f.powerCapacityKw = {};

  if (minPower !== undefined && maxPower !== undefined) {
    f.powerCapacityKw.$gte = Math.min(minPower, maxPower);
    f.powerCapacityKw.$lte = Math.max(minPower, maxPower);
  } else if (minPower !== undefined) {
    f.powerCapacityKw.$gte = minPower;
  } else {
    f.powerCapacityKw.$lte = maxPower;
  }
}


  if (q.constructionStatus) {
    f.constructionStatus = q.constructionStatus;
  }

  if (q.transactionType) {
    f.transactionType = q.transactionType;
  }

  if (q.pantry) {
    if (q.pantry === "inside") f["pantry.insidePremises"] = true;
    else if (q.pantry === "shared") f["pantry.shared"] = true;
    else f["pantry.type"] = q.pantry;
  }

  const parkingFields = parseCsv(q.parking);
  parkingFields.forEach((field) => {
    if (field === "visitorParking") f["parkingDetails.visitorParking"] = true;
    if (field === "twoWheeler") f["parkingDetails.twoWheeler"] = { $gt: 0 };
    if (field === "fourWheeler") f["parkingDetails.fourWheeler"] = { $gt: 0 };
  });

  parseCsv(q.fireSafety).forEach((field) => {
    f[`fireSafety.${field}`] = true;
  });

  applyCsvSelector(f, "flooringType", q.flooringType);
  applyCsvSelector(f, "wallFinishStatus", q.wallFinishStatus);

  if (isTruthy(q.tenantAvailable)) {
    f["tenantInfo.0"] = { $exists: true };
  }

  if (isTruthy(q.negotiable)) {
    f.isPriceNegotiable = true;
  }

  if (isTruthy(q.verifiedProperties)) {
    f["verificationDocuments.status"] = "verified";
  }

  const postedSinceDate = getPostedSinceDate(q.postedSince);
  if (postedSinceDate) {
    f.createdAt = { $gte: postedSinceDate };
  }

  if (typeof q.amenities === "string") {
    const amenities = parseCsv(q.amenities);
    if (amenities.length > 0) {
      f["amenities.title"] = { $all: amenities };
    }
  }

  if (typeof q.propertyType === "string" && q.propertyType.trim().length > 0) {
    const types = q.propertyType
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (types.length === 1) f.propertyType = types[0];
    else if (types.length > 1) f.propertyType = { $in: types };
  }


  if (
    typeof q.propertySubType === "string" &&
    q.propertySubType.trim().length > 0
  ) {
    const subTypes = q.propertySubType
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (subTypes.length === 1) f.propertySubType = subTypes[0];
    else if (subTypes.length > 1) f.propertySubType = { $in: subTypes };
  }

  return f;
}
