// models/subscription.model.ts
import { Schema, model, Types } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    userType: {
      type: String,
      enum: ["builder", "buyer", "agent", "owner"],
      required: true,
    },
    planCode: { type: String, required: true },
    tier: { type: String, required: true },
    category: {
      type: String,
      enum: ["rent", "sell", "both", "buy", "rent_view"],
      index: true,
      required: function (this: any): boolean {
        return this.userType === "owner" || this.userType === "buyer";
      },
    },

    invoiceUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "active",
        "expired",
        "cancelled",
        "pending",
        "upgraded",
        "downgraded",
      ],
      default: "pending",
    },

    upgradedFrom: {
      type: String,
    },
    
    creditAdjusted: {
      type: Number,
      default: 0,
    },

    paymentId: {
      type: Types.ObjectId,
      ref: "Payment",
    },
    usage: {
      contactUsed: { type: Number, default: 0 },
      enquiryUsed: { type: Number, default: 0 },
      contactLimit: { type: Number },
    },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);

SubscriptionSchema.index({ status: 1, createdAt: -1 });

export const Subscription = model("Subscription", SubscriptionSchema);
