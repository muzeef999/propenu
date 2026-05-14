// src/types/ownerPropertyTypes.ts
import { ObjectId } from "mongoose";

/* ----------------------------------------
   Media Item
----------------------------------------- */
export interface IMediaItem {
  type: "image" | "video" | "virtual" | "plan";
  title?: string;
  url: string;
  key?: string;
  filename?: string;
  mimetype?: string;
  order?: number;
}

/* ----------------------------------------
   Legal Certification
----------------------------------------- */
export interface ILegalCertification {
  name: string;
  link?: string;
  issuedBy?: string;
  issuedDate?: Date | string;
}

/* ----------------------------------------
   Location
----------------------------------------- */
export interface ILocation {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  mapCoordinates?: {
    type?: "Point";
    coordinates?: [number, number]; // [lng, lat]
  };
}

/* ----------------------------------------
   Owner Details (main)
----------------------------------------- */
export interface IOwnerDetails {
  ownerId: ObjectId | string; // This is the real user id of the listing owner
  ownerName?: string;
  ownerContact?: string;
}

/* ----------------------------------------
   Extra Owner Properties (optional metadata)
----------------------------------------- */
export interface IOwnerPropertiesExtra {
  userRef?: ObjectId | string;
  ownerName?: string;
  ownerContact?: string;
  ownerEmail?: string;
  ownerType?: string;
  agencyName?: string;
  isVerified?: boolean;
  documents?: { name: string; url: string }[];
}

/* ----------------------------------------
   Main Owner Property Type
----------------------------------------- */
export interface IOwnerProperty {
  _id?: ObjectId;
  title: string;
  description?: string;

  category: string;
  subcategory: string;

  propertyType?: string;
  status?: string;
  availabilityStatus?: string;

  price?: number;
  priceFrom?: number;
  priceTo?: number;

  carpetArea?: number;
  builtUpArea?: number;
  totalFloors?: number;
  floorNumber?: number;

  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  furnishing?: string;

  ownerDetails: IOwnerDetails;
  ownerProperties?: IOwnerPropertiesExtra;

  location?: ILocation;

  media?: IMediaItem[];

  interiorDetails?: any;
  nearby?: any;

  amenities?: string[];

  legalCertification?: ILegalCertification[];

  slug?: string;
  meta?: {
    views?: number;
    createdBy?: ObjectId | string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}
