import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { Payment } from "../models/paymentModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import { Types } from "mongoose";

/* ---------------- CREATE PAYMENT ORDER ---------------- */

export async function createPaymentOrder(
  planId: string,
  userId: string,
  userType: "buyer" | "builder" | "agent"
) {

   console.log("🔵 STEP 1 → INPUT");
  console.log({ planId, userId, userType });

   if (!Types.ObjectId.isValid(planId)) {
    console.error("❌ Invalid planId:", planId);
    throw new Error("Invalid planId");
  }

    console.log("🟢 STEP 2 → planId is valid");


  const plan = await Plan.findById(planId).lean();
    console.log("🟡 STEP 3 → PLAN:", plan);

  if (!plan) {
        console.error("❌ Plan not found in DB");

    throw new Error("Plan not found");
  }

  /* ✅ FREE PLAN FLOW */
  if (plan.price === 0) {
        console.log("🟢 STEP 4 → FREE PLAN");

    // 🔒 Prevent duplicate active subscription
    const existing = await Subscription.findOne({
      userId,
      userType,
      status: "active",
    });

        console.log("🟡 STEP 5 → EXISTING SUB:", existing);


    if (existing) {
      return {
        free: true,
        message: "Free plan already active",
      };
    }

    await Subscription.create({
      userId,
      userType,
      planId: plan._id,
      startDate: new Date(),
      endDate: new Date(
        Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
      ),
      status: "active",
    });


        console.log("✅ STEP 6 → FREE SUB CREATED");

    return {
      free: true,
      message: "Free plan activated",
    };
  }

    console.log("🟢 STEP 7 → PAID PLAN");

    console.log("🟡 Razorpay ENV:", {
    key: process.env.RAZORPAY_KEY_ID,
    secret: !!process.env.RAZORPAY_KEY_SECRET,
  });


let order;
try {
  order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: "INR",
    receipt: `pl_${plan._id.toString().slice(-10)}_${Date.now().toString().slice(-6)}`,
    notes: {
      planId: plan._id.toString(),
      userId,
      userType,
    },
  });

  console.log("🟢 STEP 8 → RAZORPAY ORDER:", order);

} catch (err: any) {
  console.error("❌ RAZORPAY ERROR:", err);
  throw new Error("Failed to create Razorpay order");
}

 const payment  =  await Payment.create({
    userId,
    userType,
    planId: plan._id,
    amount: plan.price,
    razorpayOrderId: order.id,
    status: "created",
  });

    console.log("✅ STEP 9 → PAYMENT SAVED:", payment._id);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID, // frontend needs this
  };
}

/* ---------------- VERIFY PAYMENT ---------------- */

export async function verifyPaymentAndActivate(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error("Missing Razorpay parameters");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.status === "paid") {
    return { success: true, message: "Payment already processed" };
  }

  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  const plan = await Plan.findById(payment.planId);
  if (!plan) {
    throw new Error("Plan not found for subscription");
  }

  await Subscription.create({
    userId: payment.userId,
    userType: payment.userType,
    planId: plan._id,
    startDate: new Date(),
    endDate: new Date(
      Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
    ),
    status: "active",
  });

  return {
    success: true,
    message: "Payment verified & subscription activated",
  };
}
