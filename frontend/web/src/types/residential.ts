import { BaseSearchParams } from "./sharedTypes";


export type AmenitiesItems = {
   key:string,
   title:string
}



export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface IResidential {
  listingType?: 'sale' | 'rent' | 'lease';
  developer?:  string;
  // base fields...
  address: string;
    gallery?: GalleryItem[];

    amenities?:AmenitiesItems[]
 pricePerSqft? :number;
  city?: string;
  title?:string;
  bhk?: number;
  description?:string;
  bedrooms?: number;
  price?:number;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  furnishing?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  parkingType?: string;
  floorNumber?: number;
  totalFloors?: number;
  facing?: string;
  transactionType?:string;
  constructionStatus?: 'ready-to-move' | 'under-construction';
  possessionDate?: Date;
  maintenanceCharges?: number;
  security?: { gated?: boolean; cctv?: boolean; guard?: boolean; details?: string };
  fireSafetyDetails?: { hasFireSafety?: boolean; fireNOCFile?: any; details?: string };
  greenCertification?: { leed?: boolean; igbc?: boolean; details?: string; file?: any };
  smartHomeFeatures?: string[];
  parkingDetails?: { visitorParking?: boolean; twoWheeler?: number; fourWheeler?: number };
  possessionVerified?: boolean;
  flooringType?: string;
  kitchenType?: string;
  listingSource?: string;
  nearbyPlaces?: string[];
}



export interface IAmenity {
  key: string;          // unique identifier (used in DB)
  title: string;        // UI label
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


  export type PostedByOption =
  | "Owners"
  | "Agents"
  | "Builders";


  export type ResidentialSearchParams = BaseSearchParams & {
  category: "Residential";
  bhk?: number;
};
