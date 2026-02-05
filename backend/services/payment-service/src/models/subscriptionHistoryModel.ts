import { Schema, model, Types } from "mongoose";

const SubscriptionHistorySchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    userType: {
      type: String,
      enum: ["builder", "buyer", "agent", "owner"],
      required: true,
    },

    planCode: {
      type: String,
      required: true,
      index: true,
    },

    planName: String,

    tier: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["rent", "sell", "both", "buy", "rent_view"],
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      required: true,
    },

    paymentId: {
      type: Types.ObjectId,
      index: true,
    },

        invoiceUrl: {
      type: String,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export const SubscriptionHistory = model(
  "SubscriptionHistory",
  SubscriptionHistorySchema
);
