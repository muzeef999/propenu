import { IFileRef } from "./sharedTypes";
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
  | "acre"
  | "guntha"
  | "cent"
  | "hectare"
  | "kanal";
export type RoadUnit = "ft" | "meter";

export interface IArea {
  value?: number;
  unit?: AreaUnit;
}

export interface IRoadWidth {
  value?: number;
  unit?: RoadUnit;
}

export interface IRoadWidth {
  value?: number;
  unit?: "ft" | "meter";
}
export interface IAgricultural {
  title?: string;
  slug?:string;
  landName: String,
  listingSource?:string;
  totalArea?: IArea;
  roadWidth?: IRoadWidth;
  boundaryWall?: boolean;
  areaUnit?: "sqft" | "sqmt" | "acre" | "guntha" | "kanal" | "hectare" | string;
  landShape?: string;
  soilType?: string;
  irrigationType?: string;
  currentCrop?: string;
  propertyType?: AgriculturalPropertyType;
  propertySubType?: AgriculturalPropertySubType;
  suitableFor?: string;
  plantationAge?: number;
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

  location?: {
    type: "Point";
    coordinates: [number, number];
  };

}
