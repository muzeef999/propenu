import axios from "axios";
import { Payment } from "../models/paymentModel";
import { verifyRazorpaySignature } from "../utils/signatureUtil";
import { razorpay } from "../config/razorpay";

export class PaymentService {
  static async createOrder({
    userId,
    role,
    planId,
    amount,
  }: {
    userId: string;
    role: string;
    planId: string;
    amount: number;
  }) {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    await Payment.create({
      userId,
      role,
      planId,
      orderId: order.id,
      amount,
    });

    return order;
  }

  static async verifyPayment({
    orderId,
    paymentId,
    signature,
  }: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    const isValid = verifyRazorpaySignature(
      orderId,
      paymentId,
      signature
    );

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentId,
        status: "success",
      },
      { new: true }
    );

    if (!payment) {
      throw new Error("Payment not found");
    }

    // 🔔 Notify user-service
    await axios.post(
      `${process.env.USER_SERVICE_URL}/subscriptions/activate`,
      {
        userId: payment.userId,
        planId: payment.planId,
        role: payment.role,
      }
    );

    return payment;
  }
}
