import mongoose, { Schema, Document } from "mongoose";

export interface PaymentDocument extends Document {
  userId: string;
  role: string;
  planId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  status: "created" | "success" | "failed";
}

const PaymentSchema = new Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, required: true },
    planId: { type: String, required: true },
    orderId: { type: String, required: true },
    paymentId: String,
    amount: Number,
    status: { type: String, default: "created" },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<PaymentDocument>(
  "Payment",
  PaymentSchema
);
