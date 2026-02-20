import mongoose, { Schema, Document } from "mongoose";

export interface IPublicLead extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  message?: string;
  createdAt: Date;
}

const PublicLeadSchema = new Schema<IPublicLead>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPublicLead>(
  "PublicLead",
  PublicLeadSchema
);