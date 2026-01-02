import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: Schema.Types.ObjectId,
    userType: String,

    planId: Schema.Types.ObjectId,

    amount: Number,
    currency: { type: String, default: "INR" },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", PaymentSchema);
