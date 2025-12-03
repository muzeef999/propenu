import mongoose from "mongoose";

export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface IResidential {
  listingType?: 'sale' | 'rent' | 'lease';
  developer?: mongoose.Types.ObjectId | null;
  // base fields...
  address: string;
    gallery?: GalleryItem[];

  city?: string;
  title?:string;
  bhk?: number;
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
  constructionStatus?: 'ready-to-move' | 'under-construction';
  possessionDate?: Date;
  maintenanceCharges?: number;
  security?: { gated?: boolean; cctv?: boolean; guard?: boolean; details?: string };
  fireSafetyDetails?: { hasFireSafety?: boolean; fireNOCFile?: any; details?: string };
  greenCertification?: { leed?: boolean; igbc?: boolean; details?: string; file?: any };
  smartHomeFeatures?: string[];
  parkingDetails?: { visitorParking?: boolean; twoWheeler?: number; fourWheeler?: number };
  possessionVerified?: boolean;
}