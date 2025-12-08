// src/types/residentialTypes.ts
import mongoose from 'mongoose';




export const RESIDENTIAL_PROPERTY_TYPES = [
  'apartment',
  'independent-house',
  'villa',
  'penthouse',
  'plot',
  'row-house',
  'studio',
] as const;

export type ResidentialPropertyType = typeof RESIDENTIAL_PROPERTY_TYPES[number];

export const RESIDENTIAL_PROPERTY_SUBTYPES = [
  '1bhk',
  '2bhk',
  '3bhk',
  '4bhk',
  '5bhk',
  'duplex',
  'triplex',
  'farmhouse',
] as const;

export type ResidentialPropertySubType = typeof RESIDENTIAL_PROPERTY_SUBTYPES[number];




export const FLOORING_TYPES = [
  'vitrified',
  'marble',
  'granite',
  'wooden',
  'ceramic-tiles',
  'mosaic',
  'normal-tiles',
  'cement',
  'other',
] as const;

export type FlooringType = (typeof FLOORING_TYPES)[number];

export const KITCHEN_TYPES = [
  'open',         // opens to living/dining
  'closed',       // fully separate
  'semi-open',
  'island',       // island counter
  'parallel',
  'u-shaped',
  'l-shaped',
] as const;

export type KitchenType = (typeof KITCHEN_TYPES)[number];

export const PROPERTY_AGE_BUCKETS = [
  'under-construction',
  '0-1-year',
  '1-5-years',
  '5-10-years',
  '10-20-years',
  '20-plus-years',
] as const;

export type PropertyAge = (typeof PROPERTY_AGE_BUCKETS)[number];

export interface IResidential {
  listingType?: 'sale' | 'rent' | 'lease';
  developer?: mongoose.Types.ObjectId | null;

  // base fields...
  address: string;
  city?: string;

  propertyType?: ResidentialPropertyType;
  propertySubType?: ResidentialPropertySubType;

  // residential-specific
  bhk?: number;
  bedrooms?: number;
  buildingName?: string;
  bathrooms?: number;
  balconies?: number;
  carpetArea?: number;
  builtUpArea?: number;
  superBuiltUpArea?: number;
  transactionType?: "new-sale" | "resale" |"pre-leased" | "rent" | "lease" ;

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

  // 🔥 NEW FIELDS wired to enums/types
  flooringType?: FlooringType;
  kitchenType?: KitchenType;
  propertyAge?: PropertyAge;
  constructionYear?: number;
  isModularKitchen?: boolean;
}
