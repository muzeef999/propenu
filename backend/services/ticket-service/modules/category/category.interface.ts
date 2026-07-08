import type { Document, Types } from "mongoose";

export interface CategoryAttrs {
  name: string;
  slug: string;
  description?: string;
  department?: string;
  priorityWeight: number;
  defaultPriority: "low" | "medium" | "high" | "urgent";
  defaultAssignee?: {
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  tags: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export type CategoryDocument = Document<unknown, object, CategoryAttrs> &
  CategoryAttrs & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

