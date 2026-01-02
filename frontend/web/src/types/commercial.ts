import { BaseSearchParams, CommercialFilters, IFileRef } from "./sharedTypes";

export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface NearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number]; // [lng, lat]
  order?: number;
}

export type SpecificationItem = {
  title: string;
  description?: string;
};

export type Specification = {
  category: string;
  items: SpecificationItem[];
  order?: number; // optional, default can be handled in code / DB
};

export const PANTRY_TYPES = [
  "none",
  "dry",
  "wet",
  "shared",
  "cafeteria-access",
] as const;

export type PantryType = (typeof PANTRY_TYPES)[number];

export type AmenitiesItems = {
  key: string;
  title: string;
};

export interface ICommercial {
  title: string;
  slug: string;
  id?: string;
  _id: string;
  floorNumber?: number;
  totalFloors?: number;
  price?: number;
  city?: string;
  listingSource?: string;
  furnishedStatus?: "unfurnished" | "semi-furnished" | "fully-furnished";
  powerBackup?: string;
  powerCapacityKw?: number;
  lift?: boolean;
  superBuiltUpArea?: string;
  gallery?: GalleryItem[];
  constructionStatus?: string;
  transactionType?: string;
  nearbyPlaces?: NearbyPlace[];
  carpetArea?: number;
  pricePerSqft?: number;
  furnishing?: string;
  seats?: number;
  officeRooms?: number;
  washrooms?: number;
  amenities: AmenitiesItems[];
  ceilingHeightFt?: number;
  builtYear?: number;
  maintenanceCharges?: number;
  fireSafety?: boolean;
  fireNOCFile?: IFileRef | null;
  loadingDock?: boolean;
  loadingDockDetails?: string;
  parkingCapacity?: number;
  tenantInfo?: {
    currentTenant?: string;
    leaseStart?: Date;
    leaseEnd?: Date;
    rent?: number;
  }[];
  zoning?: string;
  occupancyCertificateFile?: IFileRef | null;
  leaseDocuments?: IFileRef[];
  address?: string;
  pantry?: {
    type?: PantryType;
    insidePremises?: boolean;
    shared?: boolean;
  };
  description?: string;
  buildingManagement?: {
    security?: boolean;
    managedBy?: string;
    contact?: string;
  };
  cabins: number;
  meetingRooms: number;
  conferenceRooms: number;
  specifications: SpecificationItem[];
  relatedProjects?: ICommercial[];
  createdBy?: { name?: string; contact?: string; email?: string };
  verifiedProperties?: Boolean;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export type CommercialSearchParams = BaseSearchParams & {
  category: "Commercial";
  commercialType?: string;
};

export const commercialKeyMapping: Record<string, keyof CommercialFilters> = {
  "Commercial Type": "commercialType",
  "Commercial Sub Type": "commercialSubType",
  "Transaction Type": "transactionType",
  "Construction Status": "constructionStatus",
  "Built-up Area": "builtUpArea",
  "Carpet Area": "carpetArea",
  "Floor Number": "floorNumber",
  "Total Floors": "totalFloors",
  "Furnishing Status": "furnishingStatus",
  Pantry: "pantry",
  "Power Capacity": "powerCapacity",
  Parking: "parking",
  "Fire Safety": "fireSafety",
  "Flooring Type": "flooringType",
  "Wall Finish": "wallFinish",
  "Tenant Available": "tenantAvailable",
  "Banks Approved": "banksApproved",
  "Price Negotiable": "priceNegotiable",
  "Verified Properties": "verifiedProperties",
  "Posted Since": "postedSince",
  "Posted By": "postedBy",
};
