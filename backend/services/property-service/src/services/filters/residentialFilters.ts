import { BaseFilters, ResidentialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

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

      const parsed = parseNumber(token);
      if (parsed !== undefined) exact.push(parsed);
    });

  return { exact, plus };
}

function parseMinPlusTokens(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const numbers = String(value)
    .split(",")
    .map((token) => parseNumber(token))
    .filter((num): num is number => num !== undefined);

  if (numbers.length === 0) return undefined;
  return Math.min(...numbers);
}

function parseCsvTokens(value: unknown, normalize?: (token: string) => string) {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => (normalize ? normalize(token) : token));
}

function addCsvFilter(f: any, field: string, value: unknown, normalize?: (token: string) => string) {
  const values = parseCsvTokens(value, normalize);
  if (values.length === 1) {
    f[field] = values[0];
  } else if (values.length > 1) {
    f[field] = { $in: values };
  }
}

function normalizeFacingToken(token: string) {
  return token.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeCreatedByRoleToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "owner" || normalized === "owners" || normalized === "user") {
    return "user";
  }
  if (normalized === "agent" || normalized === "agents") {
    return "agent";
  }
  if (normalized === "builder" || normalized === "builders") {
    return "builder";
  }
  return normalized;
}

function getPostedSinceDate(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all") return undefined;

  const daysByLabel: Record<string, number> = {
    yesterday: 1,
    "last week": 7,
    "last 2 weeks": 14,
    "last 3 weeks": 21,
    "last month": 30,
    "last 2 months": 60,
    "last 4 months": 120,
  };

  const days = daysByLabel[normalized];
  if (!days) return undefined;

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function extendResidentialFilters(
  query: ResidentialQuery = {},
  baseFilter: Partial<BaseFilters> = {},
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  f.status = "active";

  const q = query ?? {};

  if (q.listingType) {
    f.listingType = q.listingType;
  }

  if (typeof q.locality === "string" && q.locality.trim().length > 0) {
    const localityList = q.locality
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    if (localityList.length > 0) {
      f.locality = { $in: localityList };
    }
  }

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

  if (typeof q.state === "string" && q.state.trim().length > 0) {
    f.state = q.state;
  }

  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};

    if (minPrice !== undefined && maxPrice !== undefined) {
      if (minPrice <= maxPrice) {
        f.price.$gte = minPrice;
        f.price.$lte = maxPrice;
      } else {
        // auto swap if user sends wrong order
        f.price.$gte = maxPrice;
        f.price.$lte = minPrice;
      }
    } else if (minPrice !== undefined) {
      f.price.$gte = minPrice;
    } else if (maxPrice !== undefined) {
      f.price.$lte = maxPrice;
    }
  }

  const bhk = parseBedroomTokens(q.bhk);
  const bedrooms = parseBedroomTokens(q.bedrooms ?? q.bhk);

  const addBedroomFilter = (field: "bhk" | "bedrooms", exact: number[], plus?: number) => {
    if (exact.length === 0 && plus === undefined) return;

    if (exact.length > 0 && plus === undefined) {
      f[field] = exact.length === 1 ? exact[0] : { $in: exact };
      return;
    }

    f.$and = f.$and ?? [];
    const conditions: any[] = [];

    if (exact.length > 0) {
      conditions.push({ [field]: { $in: exact } });
    }

    if (plus !== undefined) {
      conditions.push({ [field]: { $gte: plus } });
    }

    f.$and.push({ $or: conditions });
  };

  addBedroomFilter("bhk", bhk.exact, bhk.plus);
  if (q.bedrooms !== undefined || q.bhk !== undefined) {
    addBedroomFilter("bedrooms", bedrooms.exact, bedrooms.plus);
  }

  const minCarpetArea = parseNumber(q.minCarpetArea);
  const maxCarpetArea = parseNumber(q.maxCarpetArea);

  if (minCarpetArea !== undefined || maxCarpetArea !== undefined) {
    f.carpetArea = {};

    if (minCarpetArea !== undefined && maxCarpetArea !== undefined) {
      if (minCarpetArea <= maxCarpetArea) {
        f.carpetArea.$gte = minCarpetArea;
        f.carpetArea.$lte = maxCarpetArea;
      } else {
        f.carpetArea.$gte = maxCarpetArea;
        f.carpetArea.$lte = minCarpetArea;
      }
    } else if (minCarpetArea !== undefined) {
      f.carpetArea.$gte = minCarpetArea;
    } else if (maxCarpetArea !== undefined) {
      f.carpetArea.$lte = maxCarpetArea;
    }
  }

  const minBathrooms = parseMinPlusTokens(q.bathrooms);
  if (minBathrooms !== undefined) {
    f.bathrooms = { $gte: minBathrooms };
  }

  const minBalconies = parseMinPlusTokens(q.balconies);
  if (minBalconies !== undefined) {
    f.balconies = { $gte: minBalconies };
  }

  const minFourWheeler = parseNumber(q.minFourWheeler);
  if (minFourWheeler !== undefined) {
    f["parkingDetails.fourWheeler"] = { $gte: minFourWheeler };
  }

  const postedSinceDate = getPostedSinceDate(q.postedSince);
  if (postedSinceDate) {
    f.createdAt = { $gte: postedSinceDate };
  }

  if (q.transactionType) {
    f.transactionType = q.transactionType;
  }

  addCsvFilter(f, "furnishing", q.furnishing);
  addCsvFilter(f, "facing", q.facing, normalizeFacingToken);

  if (q.constructionStatus) {
    f.constructionStatus = q.constructionStatus;
  }

  if (q.transactionType) {
    f.transactionType = q.transactionType;
  }

  if (typeof q.propertyType === "string" && q.propertyType.trim().length > 0) {
  const types = q.propertyType
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (types.length === 1) {
    f.propertyType = types[0]; // fast path
  } else if (types.length > 1) {
    f.propertyType = { $in: types };
  }
}


  if (typeof q.listingSource === "string" && q.listingSource.trim().length > 0) {
    const sources = q.listingSource
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (sources.length === 1) {
      f.listingSource = sources[0];
    } else if (sources.length > 1) {
      f.listingSource = { $in: sources };
    }
  }



  if (typeof q.amenities === "string") {
    const amenityTitle = q.amenities
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    if (amenityTitle.length > 0) {
      f["amenities.title"] = { $all: amenityTitle };
    }
  }

  console.log("🏠 FINAL RESIDENTIAL MATCH:", f);

  return f;
}
