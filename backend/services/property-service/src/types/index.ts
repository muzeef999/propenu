import { Types } from "mongoose";

export type CreatorRole = "builder" | "agent" | "seller" | "admin";
export const ListingType = ["Rent", "Sell", "Buy"] as const;
export const PropertyCategory = ["Residential", "Commercial", "LandPlot", "Agricultural"] as const;
export type ListingTypeT = (typeof ListingType)[number];
export type PropertyCategoryT = (typeof PropertyCategory)[number];

export interface Address {
  addressLine?: string;
  nearbyLandmarks?: string[];
  city?: string;
  pincode?: string;
}

export interface Created {
  builder: Types.ObjectId
}

export interface Amenities {
  waterSupply?: boolean;
  powerBackup?: boolean;
  parking?: boolean;
  security?: boolean;
  gym?: boolean;
  swimmingPool?: boolean;
  clubhouse?: boolean;
  lift?: boolean;
  [key: string]: any; // allow extension
}

export interface PropertyBase {
  title: string;
  description?: string;
  userId?: Types.ObjectId;
  listingType: ListingTypeT;
  category: PropertyCategoryT;
  price?: number;
  facing?: string;
  area?: number;
  status?: "draft" | "published" | "archived" | "pending_review";
  isVerified?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  address?: Address;
  amenities?: Amenities;
  images?: Image[];
  videos?: Video[];
  listedDate?: Date;
  details?: Record<string, any>;

  // ---------- uploader / ownership ----------
  createdBy?: Types.ObjectId;       
  createdByRole?: CreatorRole;      
  builder?: Types.ObjectId | null;  
  agent?: Types.ObjectId | null;    
  seller?: Types.ObjectId | null;   
}

export interface Image {
  url: string;
  key: string;
  alt?: string;
  size?: number; 
}

export interface Video {
  url: string;
  key: string;
  alt?: string;
  size?: number; 
}

//Builder  section 
export interface Builder {
  _id?: Types.ObjectId;
  user: Types.ObjectId; 
  name: string;
  slug: string;
  company?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  contact?: { phone?: string; email?: string; website?: string };
  officeLocations?: string[];
  verified?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected" | "business_verified";
  verificationDocuments?: { type: string; url: string; status?: string; providerResponse?: any }[];
  // rera/gst/mca fields if available
  gst?: { gstin?: string; providerResponse?: any };
  mca?: { cin?: string; providerResponse?: any };
  rera?: { reraId?: string; providerResponse?: any; isVerified?: boolean };
  stats?: { totalProperties?: number; publishedCount?: number; leadsCount?: number };
  createdAt?: Date;
  updatedAt?: Date;
}

//Agent  profile 
export interface Agent {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  slug: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  agencyName?: string;
  licenseNumber?: string;
  licenseValidTill?: Date;
  verificationStatus?: "pending" | "approved" | "rejected";
  verified?: boolean;
  verificationDocuments?: { type: string; url: string; status?: string; providerResponse?: any }[];
  rera?: { reraAgentId?: string; providerResponse?: any; isVerified?: boolean };
  areasServed?: string[];
  experienceYears?: number;
  stats?: { totalProperties?: number; publishedCount?: number; rating?: number; reviews?: number };
  createdAt?: Date;
  updatedAt?: Date;
}
