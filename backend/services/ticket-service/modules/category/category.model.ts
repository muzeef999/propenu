import mongoose, { Model, Schema } from "mongoose";
import type { CategoryDocument } from "./category.interface";

const assigneeSchema = new Schema(
  {
    userId: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
  },
  { _id: false },
);

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true },
    department: { type: String, trim: true, index: true },
    priorityWeight: { type: Number, default: 0, min: 0, max: 100 },
    defaultPriority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    defaultAssignee: assigneeSchema,
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

categorySchema.index({ name: "text", slug: "text", description: "text", tags: "text" });

export const Category =
  (mongoose.models.TicketCategory as Model<CategoryDocument> | undefined) ||
  mongoose.model<CategoryDocument>("TicketCategory", categorySchema);

