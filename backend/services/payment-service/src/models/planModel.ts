import mongoose, { Schema } from "mongoose";

const PlanSchema = new Schema(
  {
    code: { type: String, unique: true, required: true },

    userType: {
      type: String,
      enum: ["buyer", "owner", "agent", "builder"],
      required: true,
    },

    category: {
      type: String,
      enum: ["sell", "rent", "both"],
      required: true,
    },

    

    tier: {
      type: String,
      enum: ["free", "tier1", "tier2", "tier3"],
      required: true,
    },

    name: String,
    price: {
      type: Number,
      required: true,
      default: 0,
    },

    durationDays: { type: Number, default: 30 },

    features: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const Plan = mongoose.model("Plan", PlanSchema);
