import mongoose, { Schema, Types } from "mongoose";

export interface IEmailTemplate {
  name: string;
  slug: string;
  subject: string;
  content: string;
  variables: string[];
  category: "festival" | "offer" | "transactional";
  status: "active" | "inactive";
  createdBy?: Types.ObjectId;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    subject: { type: String, required: true },
    content: { type: String, required: true },

    variables: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      enum: ["festival", "offer", "transactional"],
      default: "transactional",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ✅ FIX: Proper typing
const EmailTemplate = mongoose.model<IEmailTemplate>(
  "EmailTemplate",
  EmailTemplateSchema
);

export default EmailTemplate;