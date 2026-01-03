import { Types } from "mongoose";

/* API values */
export type LeadPropertyType =
  | "featuredprojects"
  | "residentials"
  | "commercials"
  | "agriculturals"
  | "landplots";

export type LeadStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "approved"
  | "rejected"
  | "closed";

/* ✅ FULL SCHEMA SHAPE (IMPORTANT) */
export interface LeadSchemaShape {
  name: string;
  phone: string;
  email?: string;

  propertyType: LeadPropertyType;
  propertyModel: string;
  projectId: Types.ObjectId;

  status: LeadStatus;
  assignedTo?: Types.ObjectId;
  approvedByManager: boolean;
  remarks?: string;
}

/* ✅ CREATE INPUT (no defaults, no mongo fields) */
export type LeadCreateInput = Omit<
  LeadSchemaShape,
  "status" | "assignedTo" | "approvedByManager"
>;

/* ✅ DB DOCUMENT */
export interface LeadDocument extends LeadSchemaShape {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
