// src/types/filterTypes.ts
import { Request } from "express";
import type { ParsedQs } from "qs";

export type RequestQuery<Q> = Request<Record<string, any>, any, any, Q>;

export interface SearchFilters {
  filter: Partial<BaseFilters>;
  sort?: string | undefined;
  propertyType?: string | undefined;
  batchSize?: number | undefined;

  [k: string]: any;
}


export interface BaseFilters {
  q?: string;
  city?: string;
  state?: string;
  pincode?: string;
  listingType?: string;
  listingSource?: string;
  status?: string;
  createdBy?: string;
  minPrice?: number;
  maxPrice?: number;
  minPricePerSqft?: number;
  maxPricePerSqft?: number;
  near?: { lng: number; lat: number; maxDistance?: number } | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // additional dynamic fields (e.g. bhk, bedrooms...) allowed
  [key: string]: any;
}

/**
 * ResidentialQuery extends ParsedQs so it's compatible with Express Request generic.
 * All fields are optional strings (coming from query params).
 */
export interface ResidentialQuery extends ParsedQs {
  bhk?: string;
  listingType?:string;
  transactionType?: "new-sale" | "resale"; 
  minBedrooms?: string;
  maxBedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  minCarpetArea?: string;
  maxCarpetArea?: string;
  furnishing?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  minPricePerSqft?: string;
  maxPricePerSqft?: string;
  amenities?: string;
}

export interface CommercialQuery extends ParsedQs {
  minCarpetArea?: string;
  maxCarpetArea?: string;
  minPowerCapacityKw?: string;
  maxPowerCapacityKw?: string;
  loadingDock?: string;
  furnishedStatus?: string;
  minWashrooms?: string;
  maxWashrooms?: string;
  propertyType?: string;
  amenities?: string;
}

export interface LandQuery extends ParsedQs {
  minPlotArea?: string;
  maxPlotArea?: string;
  plotAreaUnit?: string;
  negotiable?: string;
  cornerPlot?: string;
  readyToConstruct?: string;
  landUseZone?: string;
  facing?: string;
}

export interface AgriculturalQuery extends ParsedQs {
  minArea?: string;
  maxArea?: string;
  soilType?: string;
  irrigationType?: string;
  minBorewells?: string;
  maxBorewells?: string;
  electricityConnection?: string;
  waterSource?: string;
}
