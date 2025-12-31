import mongoose, { Schema, Document } from "mongoose";

export interface PlanDocument extends Document {
  code: string;
  role: string;
  name: string;
  price: number;
  durationDays: number;
  features: Record<string, number | boolean>;
  isActive: boolean;
}

const PlanSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },
    role: { type: String, required: true }, // buyer, tenant, owner, agent, builder
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },

    features: {
      type: Map,
      of: Schema.Types.Mixed, // number | boolean
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<PlanDocument>("Plan", PlanSchema);
