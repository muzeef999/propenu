// src/services/extendResidentialFilters.ts
import type { Request } from "express";
import { BaseFilters, ResidentialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

type TypedRequestQuery<Q> = Request & { query: Q };

export function extendResidentialFilters(
  req: TypedRequestQuery<ResidentialQuery>,
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };
  const q = req.query;

  const bhk = parseNumber(q.bhk);
  const minBedrooms = parseNumber(q.minBedrooms);
  const maxBedrooms = parseNumber(q.maxBedrooms);
  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);
  const minCarpet = parseNumber(q.minCarpetArea);
  const maxCarpet = parseNumber(q.maxCarpetArea);
  const furnishing = (q.furnishing as string | undefined)?.trim();
  const parkingCount = parseNumber(q.parkingCount);
  const propertyType = (q.propertyType as string | undefined)?.trim();
  const bedrooms = parseNumber(q.bedrooms);
  const bathrooms = parseNumber(q.bathrooms);
  const minPricePerSqft = parseNumber(q.minPricePerSqft);
  const maxPricePerSqft = parseNumber(q.maxPricePerSqft);

  if (bhk !== undefined) f.bhk = bhk;
  if (bedrooms !== undefined) f.bedrooms = bedrooms;
  if (bathrooms !== undefined) f.bathrooms = bathrooms;

  if (minCarpet !== undefined || maxCarpet !== undefined) {
    f.carpetArea = {};
    if (minCarpet !== undefined) f.carpetArea.$gte = minCarpet;
    if (maxCarpet !== undefined) f.carpetArea.$lte = maxCarpet;
  }

  if (furnishing) f.furnishing = furnishing;
  if (parkingCount !== undefined) f.parkingCount = parkingCount;
  if (propertyType) f.propertyType = propertyType;

  if (minPricePerSqft !== undefined || maxPricePerSqft !== undefined) {
    f.pricePerSqft = {};
    if (minPricePerSqft !== undefined) f.pricePerSqft.$gte = minPricePerSqft;
    if (maxPricePerSqft !== undefined) f.pricePerSqft.$lte = maxPricePerSqft;
  }

  if (minPrice !== undefined) f.minPrice = minPrice;
  if (maxPrice !== undefined) f.maxPrice = maxPrice;

  if (typeof q.amenities === "string") {
    const arr = q.amenities.split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) f["amenities.title"] = { $all: arr };
  }

  return f;
}
