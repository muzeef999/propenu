// models/subscription.model.ts
import { Schema, model, Types } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true, index: true },
    userType: { type: String, enum: ["builder", "buyer", "agent", "owner"], required: true },

    planCode: { type: String, required: true },
    tier: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },


  usage: {
    contactUsed: { type: Number, default: 0 },
    enquiryUsed: { type: Number, default: 0 },
  },

    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", SubscriptionSchema);
