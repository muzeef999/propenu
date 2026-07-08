import mongoose, { Model, Schema } from "mongoose";
import type { DepartmentDocument } from "./department.interface";

const memberSchema = new Schema(
  {
    userId: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
    isLead: { type: Boolean, default: false },
  },
  { _id: false },
);

const departmentSchema = new Schema<DepartmentDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    members: { type: [memberSchema], default: [] },
    escalationPolicy: {
      firstResponseMinutes: { type: Number, default: 60, min: 1 },
      resolutionMinutes: { type: Number, default: 1440, min: 1 },
      urgentResolutionMinutes: { type: Number, default: 240, min: 1 },
    },
    businessHours: {
      timezone: { type: String, default: "Asia/Kolkata" },
      startHour: { type: Number, default: 9, min: 0, max: 23 },
      endHour: { type: Number, default: 18, min: 1, max: 24 },
      weekdays: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

departmentSchema.index({ name: "text", slug: "text", description: "text" });

export const Department =
  (mongoose.models.TicketDepartment as Model<DepartmentDocument> | undefined) ||
  mongoose.model<DepartmentDocument>("TicketDepartment", departmentSchema);

