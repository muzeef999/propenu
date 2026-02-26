import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { Payment } from "../models/paymentModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import { Types } from "mongoose";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { uploadPdfToS3 } from "../utils/uploadPdfToS3";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";

/* ---------------- CREATE PAYMENT ORDER ---------------- */

export async function createPaymentOrder(
  planId: string,
  userId: string,
    userType: "buyer" | "owner" | "agent",
) {

  if (!Types.ObjectId.isValid(planId)) {
    console.error("❌ Invalid planId:", planId);
    throw new Error("Invalid planId");
  }


  const plan = await Plan.findById(planId).lean();

  if (!plan) {
    console.error("❌ Plan not found in DB");

    throw new Error("Plan not found");
  }

  /* ✅ FREE PLAN FLOW */
  if (plan.price === 0) {

    // 🔒 Prevent duplicate active subscription
    const existing = await Subscription.findOne({
      userId,
      userType,
      category: plan.category,
      planCode: plan.code,
      status: "active",
      endDate: { $gt: new Date() },   
    });


    if (existing) {
      return {
        free: true,
         alreadyActive: true,
        message: "Free plan already active",
      };
    }

    await Subscription.create({
      userId,
      userType: plan.userType,
      category: plan.category || "both",
      planCode: plan.code,
      tier: plan.tier,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      status: "active",
      // ✅ very important for limits
      usage: {
        contactUsed: 0,
        enquiryUsed: 0,
      },
    });

    return {
      free: true,
      message: "Free plan activated",
    };
  }


  let order;
  try {
    order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `pl_${plan._id.toString().slice(-10)}_${Date.now()
        .toString()
        .slice(-6)}`,
      notes: {
        planId: plan._id.toString(),
        userId,
        userType: plan.userType,
      },
    });

  } catch (err: any) {
    console.error("❌ RAZORPAY ERROR:", err);
    throw new Error("Failed to create Razorpay order");
  }

  const payment = await Payment.create({
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
  razorpay_signature: string,
) {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  // ✅ 1. Get payment FIRST
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.status === "paid") {
    return { success: true };
  }

  // ✅ 2. Mark payment as paid
  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  // ✅ 3. Read planId FROM payment
  const plan = await Plan.findById(payment.planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  // 🔥 Expire old subscriptions
  // 🔥 expire only SAME TYPE + SAME CATEGORY plan
  const expireFilter: any = {
    userId: payment.userId,
    userType: payment.userType,
    status: "active",
  };

  if (plan.category) {
    expireFilter.category = plan.category;
  }

  await Subscription.updateMany(expireFilter, {
    status: "expired",
  });

  const invoiceBuffer = await generateInvoicePdf({
    invoiceNo: `INV-${payment._id}`,
    userName: payment.userId ? payment.userId.toString() : "",
    planName: plan.name || plan.code,
    amount: plan.price,
    date: new Date().toISOString().split("T")[0] || "",
  });

  const s3Key = `invoices/${payment.userId}/${payment._id}.pdf`;

  const invoiceUrl = await uploadPdfToS3(invoiceBuffer, s3Key);

  // const userType = payment.userType === "user" ? "buyer" : payment.userType

  const userType = payment.userType;

  // ✅ Activate new subscription
  const subscription = await Subscription.create({
    userId: payment.userId,
    userType,
    category: plan.category || "both",
    planCode: plan.code,
    tier: plan.tier,
    startDate: new Date(),
    invoiceUrl, // ✅ VERY IMPORTANT

    endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    status: "active",
    usage: {
      contactUsed: 0,
      enquiryUsed: 0,
    },
  });

  await SubscriptionHistory.create({
    userId: payment.userId,
    userType: plan.userType,
    planCode: plan.code,
    tier: plan.tier,
    category: plan.category,
    price: plan.price,
    status: "active",
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    paymentId: payment._id,
    invoiceUrl, // ✅ VERY IMPORTANT
    purchasedAt: new Date(),
  });

  const pdfPath = generateInvoicePdf({
    invoiceNo: payment._id.toString(),
    userName: payment.userId ? payment.userId.toString() : "",
    planName: plan.name || plan.code,
    amount: plan.price,
    date: new Date().toISOString().split("T")[0] || "",
  });

  console.log("📄 Invoice PDF generated at:", pdfPath);

  return {
    success: true,
    message: "Payment verified & subscription activated",
  };
}
