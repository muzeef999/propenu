import { RESFilterKey } from ".";
import { BaseSearchParams, ResidentialFilters } from "./sharedTypes";
import type { ReactNode } from "react";

export type AmenitiesItems = {
  key: string;
  title: string;
};

export interface IUserMini {
  _id: string;
  name?: string;
  email?: string;
}

export interface NearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number]; // [lng, lat]
  order?: number;
}

export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface IResidential {
  listingType?: "sale" | "rent" | "lease";
  developer?: string;
  _id: string;
  id: string;
  // base fields...
  address: string;
  gallery?: GalleryItem[];
  amenities?: AmenitiesItems[];
  pricePerSqft?: number;
  city?: string;
  title?: string;
  bhk?: number;
  description?: string;
  bedrooms?: number;
  price?: number;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  furnishing?: "unfurnished" | "semi-furnished" | "fully-furnished";
  parkingType?: string;
  floorNumber?: number;
  totalFloors?: number;
  facing?: string;
  transactionType?: string;
  constructionStatus?: "ready-to-move" | "under-construction";
  possessionDate?: Date;
  maintenanceCharges?: number;
  isPriceNegotiable?: boolean;
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
  flooringType?: string;
  kitchenType?: string;
  listingSource?: "User" | "Agent" | "builder";
  nearbyPlaces?: NearbyPlace[];
  createdBy?: IUserMini;
  relatedProjects?: IResidential[];
  slug?: string;
  buildingName?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  type?: string;
}

export interface IAmenity {
  key: string; // unique identifier (used in DB)
  title: string; // UI label
  category?: "Sports" | "Convenience" | "Safety" | "Environment" | string;
  icon?: ReactNode;
  description?: string; // optional (future use)
}

//search

export type BHKOption =
  | "1 BHK"
  | "2 BHK"
  | "3 BHK"
  | "4 BHK"
  | "5 BHK"
  | "6 BHK"
  | "6+ BHK";

export type PostedByOption = "Owners" | "Agents" | "Builders";

export type ResidentialSearchParams = BaseSearchParams & {
  category: "Residential";
  bhk?: number;
};

export const residentialKeyMapping: Record<
  RESFilterKey,
  keyof ResidentialFilters
> = {
  "Property Type": "propertyType",
  "Possession Status": "constructionStatus",
  "Sales Type": "transactionType",
  "Covered Area": "coveredArea",
  Bathroom: "bathroom",
  Balcony: "balcony",
  Parking: "parking",
  Furnishing: "furnishing",
  Amenities: "amenities",
  Facing: "facing",
  "Posted Since": "postedSince",
  "Posted By": "listingSource",
};
