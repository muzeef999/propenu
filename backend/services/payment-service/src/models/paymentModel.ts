// models/payment.model.ts
import { Schema, model, Types } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    subscriptionId: Types.ObjectId,
    userType: String,
    provider: { type: String, default: "razorpay" },
    orderId: String,
    paymentId: String,
    planId: {
      type: Types.ObjectId,
      ref: "Plan", // 👈 needed for populate
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: Number,
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true },
);

export const Payment = model("Payment", PaymentSchema);
