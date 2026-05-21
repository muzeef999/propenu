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
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);

export const Subscription = model("Subscription", SubscriptionSchema);
