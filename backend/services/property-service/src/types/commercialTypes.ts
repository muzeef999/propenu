import { IFileRef } from "./sharedTypes";


export const PANTRY_TYPES = [
  "none",
  "dry",
  "wet",
  "shared",
  "cafeteria-access",
] as const;

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
  // retail / shop
  "high-street-shop",
  "mall-shop",
  "shutter-shop",
  "kiosk",
  "food-court-unit",
  // office
  "bare-shell",
  "warm-shell",
  "fully-furnished",
  "business-center",
  "coworking-dedicated-desk",
  "coworking-hot-desk",

  // warehouse / industrial
  "warehouse-godown",
  "logistics-hub",
  "cold-storage",
  "industrial-shed",
  // general
  "bank-branch",
  "clinic-space",
  "salon-spa",
] as const;

export type CommercialPropertyType =
  (typeof COMMERCIAL_PROPERTY_TYPES)[number];
  


export type CommercialPropertySubType =
  (typeof COMMERCIAL_PROPERTY_SUBTYPES)[number];

export interface ICommercial  {
  title: string;
  slug: string;
  floorNumber?: number;

  propertyType?: CommercialPropertyType;
  propertySubType?: CommercialPropertySubType;

  superBuiltUpArea?: number;
  carpetArea?: number;
  officeRooms?: number;
  cabins?: number;
  meetingRooms?: number;
  conferenceRooms?: number;
  seats?: number;
  transactionType?: "new-sale" | "resale" |"pre-leased" | "rent" | "lease" ;
  totalFloors?: number;
  furnishedStatus?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  constructionStatus?: 'ready-to-move' | 'under-construction';
  powerBackup?: string;
  powerCapacityKw?: number;
  lift?: boolean;
  washrooms?: number;
  ceilingHeightFt?: number;
  builtYear?: number;
  maintenanceCharges?: number;
  fireSafety?: boolean;
  fireNOCFile?: IFileRef | null;
  loadingDock?: boolean;
  loadingDockDetails?: string;
  parkingCapacity?: number;
  tenantInfo?: { currentTenant?: string; leaseStart?: Date; leaseEnd?: Date; rent?: number }[];
  zoning?: string;
  occupancyCertificateFile?: IFileRef | null;
  leaseDocuments?: IFileRef[];
  buildingManagement?: { security?: boolean; managedBy?: string; contact?: string };

  pantry?: {
    type?: PantryType;
    insidePremises?: boolean;
    shared?: boolean;
  };

  
}


