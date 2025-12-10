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
  const q = req.query ?? ({} as any);

  // parse numbers
  const bhk = parseNumber(q.bhk);
  const minBedrooms = parseNumber(q.minBedrooms);
  const maxBedrooms = parseNumber(q.maxBedrooms);
  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);
  const minCarpet = parseNumber(q.minCarpetArea);
  const maxCarpet = parseNumber(q.maxCarpetArea);
  const furnishing = (q.furnishing as string | undefined)?.trim();
  const parkingCount = parseNumber(q.parkingCount);
  const propertyTypeRaw = (q.propertyType as string | undefined)?.trim();
  const bedrooms = parseNumber(q.bedrooms);
  const bathrooms = parseNumber(q.bathrooms);
  const minPricePerSqft = parseNumber(q.minPricePerSqft);
  const maxPricePerSqft = parseNumber(q.maxPricePerSqft);

  // exact numeric fields
  if (bhk !== undefined) {
    f.bhk = bhk;
    if (typeof f.bedrooms === "undefined") f.bedrooms = bhk;
  }
  if (bedrooms !== undefined) {
    f.bedrooms = bedrooms;
    if (typeof f.bhk === "undefined") f.bhk = bedrooms;
  }
  if (bathrooms !== undefined) f.bathrooms = bathrooms;

  // bedrooms range (min/maxBedrooms) -> store as bedrooms.$gte / $lte
  if (minBedrooms !== undefined || maxBedrooms !== undefined) {
    f.bedrooms = f.bedrooms ?? {};
    if (minBedrooms !== undefined) f.bedrooms.$gte = minBedrooms;
    if (maxBedrooms !== undefined) f.bedrooms.$lte = maxBedrooms;
    // mirror the shape to bhk as well for compatibility
    if (typeof f.bhk === "undefined") f.bhk = f.bedrooms;
  }

  // carpet area -> carpetArea.$gte / $lte
  if (minCarpet !== undefined || maxCarpet !== undefined) {
    f.carpetArea = {};
    if (minCarpet !== undefined) f.carpetArea.$gte = minCarpet;
    if (maxCarpet !== undefined) f.carpetArea.$lte = maxCarpet;
  }

  // price -> price.$gte / $lte
  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = f.price ?? {};
    if (minPrice !== undefined) f.price.$gte = minPrice;
    if (maxPrice !== undefined) f.price.$lte = maxPrice;
  }

  // pricePerSqft range
  if (minPricePerSqft !== undefined || maxPricePerSqft !== undefined) {
    f.pricePerSqft = {};
    if (minPricePerSqft !== undefined) f.pricePerSqft.$gte = minPricePerSqft;
    if (maxPricePerSqft !== undefined) f.pricePerSqft.$lte = maxPricePerSqft;
  }

  if (furnishing) f.furnishing = furnishing;
  if (parkingCount !== undefined) f.parkingCount = parkingCount;
  if (propertyTypeRaw) {
    f.propertyType = propertyTypeRaw;
  }

  if (typeof q.amenities === "string") {
    const arr = q.amenities.split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) f["amenities.title"] = { $all: arr };
  }

  return f;
}
