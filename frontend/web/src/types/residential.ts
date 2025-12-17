

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
  parkingCount?: number;
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
  createdBy?: { name?: string; contact?: string; email?: string };
}