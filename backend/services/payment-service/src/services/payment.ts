import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { Payment } from "../models/paymentModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";

/* ---------------- CREATE PAYMENT ORDER ---------------- */

export async function createPaymentOrder(
  planId: string,
  userId: string,
  userType: string
) {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  // Free plan → no Razorpay
  if (plan.price === 0) {
    await Subscription.create({
      userId,
      userType,
      planId: plan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 86400000),
      status: "active",
    });

    return { free: true };
  }

  const order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: "INR",
  });

  await Payment.create({
    userId,
    userType,
    planId,
    amount: plan.price,
    razorpayOrderId: order.id,
    status: "created",
  });

  return order;
}

/* ---------------- VERIFY PAYMENT ---------------- */

export async function verifyPaymentAndActivate(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid signature");
  }

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  const plan = await Plan.findById(payment.planId);

  await Subscription.create({
    userId: payment.userId,
    userType: payment.userType,
    planId: plan!._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + plan!.durationDays * 86400000),
    status: "active",
  });

  return { success: true };
}
