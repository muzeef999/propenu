import { BaseFilters, ResidentialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendResidentialFilters(
  query: ResidentialQuery = {},
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  const q = query ?? {};

  if (q.listingType) {
      f.listingType = q.listingType;
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
    if (minPrice !== undefined) f.price.$gte = minPrice;
    if (maxPrice !== undefined) f.price.$lte = maxPrice;
  }

  const bhk = parseNumber(q.bhk);

  if (bhk !== undefined) {
    f.bhk = bhk;
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

  if (q.propertyType) {
    f.propertyType = q.propertyType;
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
