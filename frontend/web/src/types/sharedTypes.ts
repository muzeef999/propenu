import {
  categoryOption,
  ListingAPIValue,
  ListingUILabel,
} from "@/Redux/slice/filterSlice";
import { AgriculturalSearchParams } from "./agricultural";
import { CommercialSearchParams } from "./commercial";
import { LandSearchParams } from "./land";
import { ResidentialSearchParams } from "./residential";

export type ListingType = "buy" | "rent" | "lease";
export type AreaUnit =
  | "sqft"
  | "sqmt"
  | "acre"
  | "guntha"
  | "kanal"
  | "hectare";
export type FurnishingStatus =
  | "unfurnished"
  | "semi-furnished"
  | "fully-furnished";
export type ConstructionStatus = "ready-to-move" | "under-construction";
export type PropertyStatus = "active" | "inactive" | "archived";

export interface IBaseListing {
  title: string;
  slug?: string; // optional because you generate it in pre('validate')
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
  // ---------- SINGLE ----------
  propertyType?: string;
  salesType?: string;
  possessionStatus?: string;
  furnishing?: string;
  postedSince?: string;
  postedBy?: string;

   coveredArea?: {
    min?: number;
    max?: number;
  };


  // ---------- MULTIPLE ----------
  bathroom?: string[];
  balcony?: string[];
  parking?: string[];
  amenities?: string[];
  facing?: string[];

    verifiedProperties?: boolean;


  // ---------- SWITCH ----------
  verifiedOnly?: boolean;

  // ---------- OTHERS ----------
  bhk?: number;
  locality?: string;
}

export interface CommercialFilters {
  /* Type & transaction */
  commercialType?: string[];           // Office, Shop, Warehouse…
  commercialSubType?: string[];         // Mall Shop, SEZ Office…
  transactionType?: "new-sale" | "resale";
  constructionStatus?: "ready-to-move" | "under-construction";

  builtUpArea?: { min?: number; max?: number };
  carpetArea?: { min?: number; max?: number };

  floorNumber?: string[];
  totalFloors?: string[];

  furnishingStatus?: "unfurnished" | "semi-furnished" | "fully-furnished";
  pantry?: "Inside Premises" | "Shared";
  powerCapacity?: string[];

  parking?: "Visitor Parking" | "2 Wheeler" | "4 Wheeler";

  fireSafety?: string[];
  flooringType?: string[];
  wallFinish?: string[];

  tenantAvailable?: boolean;
  banksApproved?: string[];
  priceNegotiable?: boolean;
  verifiedProperties?: boolean;

  postedSince?: string;
  postedBy?: string[];
  locality?: string;
}


export interface LandFilters {
  landType?: string[];
  landSubType?: string[];

  plotArea?: { min?: number; max?: number };
  dimensions?: {
    length?: number;
    width?: number;
  };

  roadWidth?: string[];
  facing?: string[];
  cornerPlot?: boolean;
  readyToConstruct?: boolean;

  waterConnection?: boolean;
  electricityConnection?: boolean;

  approvedBy?: string[];
  landUseZone?: string[];
  banksApproved?: string[];
  priceNegotiable?: boolean;
  verifiedProperties?: boolean;

  postedSince?: string;
  postedBy?: string[];
  locality?: string;
  
}

export interface AgriculturalFilters {
  agriculturalType?: string[];
  agriculturalSubType?: string[];

  totalArea?: { min?: number; max?: number };
  areaUnit?: "Acre" | "Guntha" | "Cent" | "Hectare";

  soilType?: string[];
  irrigationType?: string[];
  waterSource?: string[];

  borewellCount?: string[];
  electricityConnection?: boolean;
  roadWidth?: string[];
  accessRoadType?: string[];
  boundaryWall?: boolean;
 
  currentCrop?: string[];
  plantationAge?: string[];

  stateRestrictions?: boolean;
  priceNegotiable?: boolean;
  verifiedProperties?: boolean;

  postedSince?: string;
  postedBy?: string[];
  locality?: string;
}


export interface FilterState {
  /* -------- Core -------- */
  listingTypeLabel: ListingUILabel;
  listingTypeValue: ListingAPIValue;

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
