import { BaseSearchParams, IFileRef } from "./sharedTypes";

export interface Amenity {
  key: string;
  title: string;
}
export interface IUnitValue {
  value: number;
  unit: string; // sqft, acres, meters etc
}

export interface IUserMini {
  _id: string;
  name: string;
  email: string;
}

export interface GalleryItem {
  url: string;
  key?: string;
  caption?: string;
    filename?: string;
    
}
export interface IAgricultural {
  boundaryWall?: boolean;
  areaUnit?: "sqft" | "sqmt" | "acre" | "guntha" | "kanal" | "hectare" | string;
  landShape?: string;
  soilType?: string;
  gallery?: GalleryItem[];
  listingSource: string;
  totalArea?: IUnitValue;
  address?: string;
  description?: string;
  amenities?: Amenity[];

  carpetArea?: number;
  roadWidth?: IUnitValue;
  transactionType?: "buy" | "lease" ;
  constructionStatus?: "ready" | "under_construction";
  furnishing?: "furnished" | "semi_furnished" | "unfurnished";
  kitchenType?: "open" | "closed";

  createdBy?: IUserMini;

  price?: number;
  title?: string;
  city?: string;
  superBuiltUpArea?: number;
  pricePerSqft?: number;
  irrigationType?: string;
  currentCrop?: string;
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
}

export type AgriculturalSearchParams = BaseSearchParams & {
  category: "Agricultural";
  soilType?: string;
};
