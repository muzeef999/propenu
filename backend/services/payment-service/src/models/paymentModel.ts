// models/payment.model.ts
import { Schema, model, Types } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: Types.ObjectId,
    subscriptionId: Types.ObjectId,
    userType: String,  
    provider: { type: String, default: "razorpay" },
    orderId: String,
    paymentId: String,

    planId: Types.ObjectId,

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
  { timestamps: true }
);

export const Payment = model("Payment", PaymentSchema);
