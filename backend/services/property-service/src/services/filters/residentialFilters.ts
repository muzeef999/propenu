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

  if (q.listingSource) {
    f.listingSource = q.listingSource;
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

  if (q.transactionType) {
    f.transactionType = q.transactionType;
  }

  if (q.furnishing) {
    f.furnishing = q.furnishing;
  }

  if (q.facing) {
    f.facing = q.facing;
  }

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
