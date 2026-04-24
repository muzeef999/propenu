// src/types/residentialTypes.ts
import mongoose from "mongoose";
import { Types } from "mongoose";
import { IVerificationDoc } from "./sharedTypes";
import { IPromotion } from "../models/sharedSchemas";

export const RESIDENTIAL_PROPERTY_TYPES = [
  "apartment",
  "independent-house",
  "villa",
  "penthouse",
  "studio",
  "duplex",
  "triplex",
  "farmhouse",
  "independent-builder-floor",
] as const;

export type ResidentialPropertyType =
  (typeof RESIDENTIAL_PROPERTY_TYPES)[number];

export const FLOORING_TYPES = [
  "vitrified",
  "marble",
  "granite",
  "wooden",
  "ceramic-tiles",
  "mosaic",
  "normal-tiles",
  "cement",
  "other",
] as const;

export type FlooringType = (typeof FLOORING_TYPES)[number];

export const KITCHEN_TYPES = [
  "open", // opens to living/dining
  "closed", // fully separate
  "semi-open",
  "island", // island counter
  "parallel",
  "u-shaped",
  "l-shaped",
] as const;

export type KitchenType = (typeof KITCHEN_TYPES)[number];

export const PROPERTY_AGE_BUCKETS = [
  "under-construction",
  "0-1-year",
  "1-5-years",
  "5-10-years",
  "10-20-years",
  "20-plus-years",
] as const;

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface IApproval {
  status?: ApprovalStatus;   // ✅ ADD THIS
  isApprovedByManager?: boolean;
  approvedByManager?: Types.ObjectId;
  approvedAt?: Date;
  approvalComment?: string;
  approvalToken?: string | undefined; // ✅ FIX 2
}


export type PropertyAge = (typeof PROPERTY_AGE_BUCKETS)[number];

export interface ICompletion {
  percent: number;
  step: number;
  lastSection?: string;
}

export interface IImage {
  url: string
  key?: string
  filename?: string
}

export interface IResidential {
  title?: string;
  slug: string;
  listingSource?: string;
  verificationDocuments?: IVerificationDoc[];
  listingType?: "sale" | "rent" | "lease";
  developer?: mongoose.Types.ObjectId | null;
  address: string;
  status?: string;
  isPublished?: boolean;
  completion?: ICompletion;
  locality: string;
  city?: string;
  state?: string;
  pincode?: string;
  price?: string;
  promotion?: IPromotion;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
   gallery?: IImage[]   // ✅ ADD THIS
  propertyType?: ResidentialPropertyType;
  // residential-specific
  bhk?: number;
  bedrooms?: number;
  buildingName?: string;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  transactionType?: "new-sale" | "resale" | "pre-leased" | "rent" | "lease";
  furnishing?: "unfurnished" | "semi-furnished" | "fully-furnished";
  parkingType?: string;
  floorNumber?: number;
  totalFloors?: number;
  facing?: string;
  constructionStatus?: "ready-to-move" | "under-construction";
  possessionDate?: Date;
  maintenanceCharges?: number;
  security?: {
    gated?: boolean;
    cctv?: boolean;
    guard?: boolean;
    details?: string;
  };
  fireSafetyDetails?: {
    hasFireSafety?: boolean;
    fireNOCFile?: any;
    details?: string;
  };
  greenCertification?: {
    leed?: boolean;
    igbc?: boolean;
    details?: string;
    file?: any;
  };
  smartHomeFeatures?: string[];
  parkingDetails?: {
    visitorParking?: boolean;
    twoWheeler?: number;
    fourWheeler?: number;
  };
  possessionVerified?: boolean;
  createdBy?: Types.ObjectId;
  // 🔥 NEW FIELDS wired to enums/types
  flooringType?: FlooringType;
  kitchenType?: KitchenType;
  propertyAge?: PropertyAge;
  constructionYear?: number;
  isModularKitchen?: boolean;
  approval?: IApproval; // ⭐ ADD THIS
  updatedBy?: Types.ObjectId;
}
