import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    userType: { type: String, required: true },

    planId: { type: Schema.Types.ObjectId, ref: "Plan" },

    startDate: Date,
    endDate: Date,

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model(
  "Subscription",
  SubscriptionSchema
);
