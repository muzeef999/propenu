import { categoryOption, ListingOption } from "@/Redux/slice/filterSlice";
import { AgriculturalSearchParams } from "./agricultural";
import { CommercialSearchParams } from "./commercial";
import { LandSearchParams } from "./land";
import { ResidentialSearchParams } from "./residential";

export type ListingType = 'buy' | 'rent' | 'lease';
export type AreaUnit = 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare';
export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type ConstructionStatus = 'ready-to-move' | 'under-construction';
export type PropertyStatus = 'active' | 'inactive' | 'archived';




export interface IBaseListing {
  title: string;
  slug?: string;         // optional because you generate it in pre('validate')
  address?: string;
  city?: string;
  // add other truly-shared listing props here
}


/* -------------------------
   FILE / MEDIA SCHEMAS
   ------------------------- */
export interface IFileRef {
  title?: string;
  url?: string;
  key?: string;
  filename?: string;
  mimetype?: string;
  uploadedAt?: Date;
}



export interface IImage {
  url: string;
  key?: string;
  filename?: string;
  mimetype?: string;
  order?: number;
  caption?: string;
}



export type SearchFilterParams =
  | ResidentialSearchParams
  | CommercialSearchParams
  | LandSearchParams
  | AgriculturalSearchParams;


// src/types/searchFilter.ts
export type BaseSearchParams = {
  search?: string;
};



 export interface ResidentialFilters {
  bhk?: number;
  bedrooms?: number;
  bathrooms?: number;
  postedBy?: string;
  locality?: string;
}

export interface CommercialFilters {
  commercialType?: string;
  parking?: string;
  minArea?: number;
  maxArea?: number;
    postedBy?: string;
  locality?: string;
}

export interface LandFilters {
  facing?: string;
  roadFacing?: string;
  minArea?: number;
  maxArea?: number;
}

export interface AgriculturalFilters {
  soilType?: string;
  minArea?: number;
  maxArea?: number;
}

export interface FilterState {
  /* -------- Core -------- */
  listingType: ListingOption;
  category: categoryOption;
  searchText: string;

  /* -------- Shared -------- */
  minBudget: number;
  maxBudget: number;

  /* -------- Category Buckets -------- */
  residential: ResidentialFilters;
  commercial: CommercialFilters;
  land: LandFilters;
  agricultural: AgriculturalFilters;
}



