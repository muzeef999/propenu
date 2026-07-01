import { IPromotion } from "../models/sharedSchemas";
import { IFileRef, IListingAuditFields, IVerificationDoc } from "./sharedTypes";
import mongoose, { Types } from "mongoose";

export const AGRICULTURAL_PROPERTY_TYPES = [
  "agricultural-land",
  "farm-land",
  "orchard-land",
  "plantation",
  "wet-land",
  "dry-land",
  "ranch",
  "dairy-farm",
] as const;

export type AgriculturalPropertyType =
  (typeof AGRICULTURAL_PROPERTY_TYPES)[number];

export const AGRICULTURAL_PROPERTY_SUBTYPES = [
  "irrigated",
  "non-irrigated",
  "fenced",
  "unfenced",
  "with-well",
  "with-borewell",
  "with-electricity",
  "near-road",
  "inside-village",
  "farmhouse-permission",
] as const;

export type AgriculturalPropertySubType =
  (typeof AGRICULTURAL_PROPERTY_SUBTYPES)[number];

export type AreaUnit =
  | "sqft"
  | "sqmt"
  | "sqyd"
  | "acre"
  | "guntha"
  | "cent"
  | "hectare"
  | "kanal";
export type RoadUnit = "ft" | "meter";

export interface ICompletion {
  percent: number;
  step: number;
  lastSection?: string;
}

export interface IArea {
  value?: number;
  unit?: AreaUnit;
}

export interface IRoadWidth {
  value?: number;
  unit?: RoadUnit;
}
export interface IImage {
  url: string;
  key?: string;
  filename?: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface IApproval {
  status?: ApprovalStatus; // ✅ ADD THIS
  isApprovedByManager?: boolean;
  approvedByManager?: Types.ObjectId;
  approvedAt?: Date;
  approvalComment?: string;
  approvalToken?: string | undefined; // ✅ FIX 2
}

export interface IRoadWidth {
  value?: number;
  unit?: "ft" | "meter";
}
export interface IAgricultural extends IListingAuditFields {
  title?: string;
  completion?: ICompletion;
  promotion?: IPromotion;
  verificationDocuments?: IVerificationDoc[];
  status?: string;
  isPublished?: boolean;
  slug?: string;
  propertyCode?: string;
  price?: string;
  landName: String;
  listingSource?: string;
  totalArea?: IArea;
  roadWidth?: IRoadWidth;
  boundaryWall?: boolean;
  areaUnit?: "sqft" | "sqmt" | "sqyd" | "acre" | "guntha" | "kanal" | "hectare" | string;
  landShape?: string;
  soilType?: string;
  irrigationType?: string;
  currentCrop?: string;
  plantationAge?: number;
  propertyType?: AgriculturalPropertyType;
  propertySubType?: AgriculturalPropertySubType;
  numberOfBorewells?: number;
  borewellDetails?: {
    depthMeters?: number;
    yieldLpm?: number;
    drilledYear?: number;
    files?: any[];
  };
  electricityConnection?: boolean;
  waterSource?: string;
  accessRoadType?: string;
  soilTestReport?: IFileRef | null;
  statePurchaseRestrictions?: string;
  agriculturalUseCertificate?: IFileRef | null;
  createdBy?: Types.ObjectId;
  locality: string;
  city?: string;
  state?: string;
  pincode?: string;
  gallery?: IImage[]; // ✅ ADD THIS

  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  approval?: IApproval; // ⭐ ADD THIS
  updatedBy?: Types.ObjectId;
}
