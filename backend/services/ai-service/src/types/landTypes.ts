import { IPromotion } from "../models/sharedSchemas";
import { IFileRef, IVerificationDoc } from "./sharedTypes";
import mongoose, { Types } from "mongoose";

export const LAND_PROPERTY_TYPES = [
  "plot",
  "residential-plot",
  "commercial-plot",
  "industrial-plot",
  "investment-plot",
  "corner-plot",
  "na-plot", // non-agricultural approved
] as const;

export type LandPropertyType = (typeof LAND_PROPERTY_TYPES)[number];

export const LAND_PROPERTY_SUBTYPES = [

  "gated-community",
  "non-gated",
  "corner",
  "road-facing",
  "two-side-open",
  "three-side-open",

  "resale",
  "new-plot",
] as const;
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface IApproval {
  status?: ApprovalStatus;   // ✅ ADD THIS
  isApprovedByManager?: boolean;
  approvedByManager?: Types.ObjectId;
  approvedAt?: Date;
  approvalComment?: string;
  approvalToken?: string | undefined; // ✅ FIX 2
}
export type LandPropertySubType = (typeof LAND_PROPERTY_SUBTYPES)[number];

export interface ICompletion {
  percent: number;
  step: number;
  lastSection?: string;
}

export interface IImage {
  url: string
  key?: string
  filename?: string
}

export interface ILand {
   title?: string;
  dimensions: {
    length: { type: Number; required: true }; // e.g., 40
    width: { type: Number; required: true }; // e.g., 60
  };
  propertyType?: LandPropertyType;
  propertySubType?: LandPropertySubType;
   status?:string;
   price?: string;
  isPublished?: boolean;
  verificationDocuments?: IVerificationDoc[];
  completion?: ICompletion;
  plotArea?: number;
  plotAreaUnit?: "sqft" | "sqmt" | "acre" | "guntha" | "kanal" | "hectare";
  roadWidthFt?: number;
  negotiable?: boolean;
  readyToConstruct?: boolean;
  waterConnection?: boolean;
  electricityConnection?: boolean;
  approvedByAuthority?: string[];
  facing?: string;
  cornerPlot?: boolean; 
  fencing?: boolean;
  landUseZone?: string;
  promotion?: IPromotion;
  conversionCertificateFile?: IFileRef | null;
  encumbranceCertificateFile?: IFileRef | null;
  soilTestReport?: IFileRef | null;
  surveyNumber?: string;
  layoutType?: string;
  landName: String,
  slug?:string;
listingSource?:string;
createdBy?: Types.ObjectId;
  locality: string;
     gallery?: IImage[]   // ✅ ADD THIS
  
  city?: string;
  state?: string;
  pincode?: string;

  location?: {
    type: "Point";
    coordinates: [number, number];
  };

    approval?:IApproval;
  updatedBy?: Types.ObjectId;


}
