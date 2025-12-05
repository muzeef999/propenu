// src/types/agent.types.ts

import { Types } from "mongoose";

export interface VerificationDocument {
  type?: string;
  url?: string;
  providerResponse?: any;
  status?: string;
}

export interface ReraInfo {
  reraAgentId?: string;
  providerResponse?: any;
  isVerified?: boolean;
}

export interface AgentStats {
  totalProperties?: number;
  publishedCount?: number;
}

export interface Agent {
  _id: string;
  user: Types.ObjectId | string; 
  name: string;
  slug: string;

  avatar?: {
    url:string;
    key:string
  };
  coverImage?: {
    url:string;
    key:string
  };

  bio?: string;
  agencyName?: string;
  licenseNumber?: string;
  licenseValidTill?: Date | string;

  areasServed?: string[];
  city?: string;
  experienceYears?: number;
  dealsClosed?: number;
  languages?: string[];

  verificationStatus: "pending" | "approved" | "rejected";

  verificationDocuments?: VerificationDocument[];
  rera?: ReraInfo;

  stats?: AgentStats;

  createdAt: Date;
  updatedAt: Date;
}
