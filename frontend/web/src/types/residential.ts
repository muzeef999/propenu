import mongoose from "mongoose";

export interface IResidential {
  listingType?: 'sale' | 'rent' | 'lease';
  developer?: mongoose.Types.ObjectId | null;
  // base fields...
  address: string;
  city?: string;
  // residential-specific
  bhk?: number;
  bedrooms?: number;
  
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