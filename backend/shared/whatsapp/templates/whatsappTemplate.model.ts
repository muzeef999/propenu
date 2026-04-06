import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppTemplate extends Document {
  name: string;
  language: string;
  category: string;
  components: any[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    language: {
      type: String,
      default: "en",
    },
    category: {
      type: String,
      required: true,
    },

    // ✅ FIXED HERE
    components: [Schema.Types.Mixed],

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IWhatsAppTemplate>(
  "WhatsAppTemplate",
  WhatsAppTemplateSchema
);