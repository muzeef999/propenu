// models/subscription.model.ts
import { Schema, model, Types } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true, index: true },
    userType: { type: String, enum: ["builder", "buyer", "agent"], required: true },

    planCode: { type: String, required: true },
    tier: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },

    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", SubscriptionSchema);
