import type { Document, Types } from "mongoose";

export interface DepartmentMember {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  isLead?: boolean;
}

export interface DepartmentAttrs {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  members: DepartmentMember[];
  escalationPolicy: {
    firstResponseMinutes: number;
    resolutionMinutes: number;
    urgentResolutionMinutes: number;
  };
  businessHours?: {
    timezone: string;
    startHour: number;
    endHour: number;
    weekdays: number[];
  };
  isActive: boolean;
}

export type DepartmentDocument = Document<unknown, object, DepartmentAttrs> &
  DepartmentAttrs & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

