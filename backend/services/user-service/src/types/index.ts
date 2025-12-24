import { Types } from "mongoose";

export interface GetAgentsQuery {
  page?: string;
  limit?: string;
  search?: string;
}


export interface GetBuilderQuery {
  page?: string;
  limit?: string;
  search?: string;
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

export interface NominatimSearchRaw {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface LocationItem {
  id: number;
  name: string;
  lat: number;
  lon: number;
  category: string;  
  type: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
}
