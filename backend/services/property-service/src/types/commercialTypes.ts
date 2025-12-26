import { IFileRef } from "./sharedTypes";
import { Types } from "mongoose";

export const PANTRY_TYPES = ["none", "shared", "no-shared"] as const;

export type PantryType = (typeof PANTRY_TYPES)[number];

export const COMMERCIAL_PROPERTY_TYPES = [
  "office",
  "retail",
  "shop",
  "showroom",
  "warehouse",
  "industrial",
  "coworking",
  "restaurant",
  "clinic",
  "land",
  "other",
] as const;

export const COMMERCIAL_PROPERTY_SUBTYPES = [
  // office
  "bare-shell", "warm-shell", "business-center",
  //  retail
  "high-street-shop", "mall-shop", "kiosk", "food-court-unit",
  //shop
  "high-street-shop", "shutter-shop", "mall-shop",
  //showroom
  "high-street-shop","showroom-space",
   //warehouse
   "warehouse-godown", "logistics-hub", "cold-storage",
  //industrial
   "industrial-shed",
  // coworking
   "coworking-dedicated-desk", "coworking-hot-desk",
  // restaurant
   "food-court-unit",
  //clinic
   "clinic-space",
] as const;

export type CommercialPropertyType = (typeof COMMERCIAL_PROPERTY_TYPES)[number];

export type CommercialPropertySubType =
  (typeof COMMERCIAL_PROPERTY_SUBTYPES)[number];

export type WallFinishStatus = (typeof WALL_FINISH_STATUS)[number];
export type FlooringType = (typeof FLOORING_TYPES)[number];

export const WALL_FINISH_STATUS = [
  "no-partitions",
  "brick-walls",
  "cement-block-walls",
  "plastered-walls",
] as const;

export const FLOORING_TYPES = [
  "bare-cement",
  "vitrified-tiles",
  "ceramic-tiles",
  "marble",
  "granite",
  "carpet",
  "epoxy",
  "wooden-laminate",
] as const;

export interface ICommercial {
  title: string;
  slug: string;
  floorNumber?: number;

  propertyType?: CommercialPropertyType;
  propertySubType?: CommercialPropertySubType;

  wallFinishStatus?: WallFinishStatus;
  flooringType?: FlooringType;

  fireSafety?: {
    fireExtinguisher?: boolean;
    fireSprinklerSystem?: boolean;
    fireHoseReel?: boolean;
    fireHydrant?: boolean;
    smokeDetector?: boolean;
    fireAlarmSystem?: boolean;
    fireControlPanel?: boolean;
    emergencyExitSignage?: boolean;
  };

  superBuiltUpArea?: number;
  carpetArea?: number;
  officeRooms?: number;
  cabins?: number;
  meetingRooms?: number;
  conferenceRooms?: number;
  seats?: number;
  transactionType?: "new-sale" | "resale" | "pre-leased" | "rent" | "lease";
  totalFloors?: number;
  furnishedStatus?: "unfurnished" | "semi-furnished" | "fully-furnished";
  constructionStatus?: "ready-to-move" | "under-construction";
  powerBackup?: string;
  powerCapacityKw?: number;
  lift?: boolean;
  washrooms?: number;
  ceilingHeightFt?: number;
  builtYear?: number;
  maintenanceCharges?: number;
  fireNOCFile?: IFileRef | null;
  loadingDock?: boolean;
  loadingDockDetails?: string;
  parkingCapacity?: number;
   listingSource?: string;
  tenantInfo?: {
    currentTenant?: string;
    leaseStart?: Date;
    leaseEnd?: Date; 
    rent?: number;
  }[];
  zoning?: string;
  occupancyCertificateFile?: IFileRef | null;
  leaseDocuments?: IFileRef[];
  buildingManagement?: {
    security?: boolean;
    managedBy?: string;
    contact?: string;
  };
  parkingDetails?: {
    visitorParking?: boolean;
    twoWheeler?: number;
    fourWheeler?: number;
  };
  builtUpArea?: number;
  pantry?: {
    type?: PantryType;
    insidePremises?: boolean;
    shared?: boolean;
  };
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
