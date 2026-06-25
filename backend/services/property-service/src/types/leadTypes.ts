import { Types } from "mongoose";

/* API values */
export type LeadPropertyType =
  | "featuredprojects"
  | "residentials"
  | "commercials"
  | "agriculturals"
  | "landplots";

export type LeadStatus =
  | "new_lead"
  | "interested"
  | "not_interested"
  | "follow_up"
  | "site_visit"
  | "sale";

/* ✅ FULL SCHEMA SHAPE (IMPORTANT) */
export interface LeadSchemaShape {
  name: string;
  phone: string;
  email?: string;

  // 🔥 Who created the lead (buyer/agent)
  createdBy: Types.ObjectId;

  // 🔥 Who owns the property
  ownerId: Types.ObjectId;

  // 🔥 sale | rent | lease
  listingType: "sale" | "rent" | "lease";

  propertyType: LeadPropertyType;
  propertyModel: string;
  projectId: Types.ObjectId;

  status: LeadStatus;
  assignedTo?: Types.ObjectId | null;
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
