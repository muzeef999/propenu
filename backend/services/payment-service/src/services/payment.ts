import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { Payment } from "../models/paymentModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import { Types } from "mongoose";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { uploadPdfToS3 } from "../utils/uploadPdfToS3";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import User from "../../../user-service/src/models/userModel";
import { generateBusinessNumber } from "../utils/generateBusinessNumber";

type VerifyPaymentResult = {
  success: true;
  alreadyPaid?: boolean;
  subscriptionName?: string;
  invoiceUrl?: string;
  message?: string;
};

type InvoiceCustomer = {
  name?: string | undefined;
  phone?: string | undefined;
};

/* ======================================================
   CREATE PAYMENT ORDER
====================================================== */

export async function createPaymentOrder(
  planId: string,
  userId: string,
  userType: "buyer" | "owner" | "agent"
) {
  if (!Types.ObjectId.isValid(planId)) {
    throw new Error("Invalid planId");
  }

  const plan = await Plan.findById(planId).lean();

  if (!plan) {
    throw new Error("Plan not found");
  }

  /* ======================================================
     FREE PLAN FLOW
  ====================================================== */

  if (plan.price === 0) {

    // Check if same plan already active
    const existing = await Subscription.findOne({
      userId,
      userType: plan.userType,
      category: plan.category,
      status: "active",
      endDate: { $gt: new Date() }
    });

    if (existing) {
      return {
        free: true,
        alreadyActive: true,
        subscriptionName: plan.name || plan.code,
        message: "Free plan already active"
      };
    }

    // Expire old plans of same category
    await Subscription.updateMany(
      {
        userId,
        userType: plan.userType,
        category: plan.category,
        status: "active"
      },
      { status: "expired" }
    );

    // Create subscription
    await Subscription.create({
      userId,
      userType: plan.userType,
      category: plan.category || "both",
      planCode: plan.code,
      tier: plan.tier,
      startDate: new Date(),
      endDate: new Date(
        Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
      ),
      status: "active",
      usage: {
        contactUsed: 0,
        enquiryUsed: 0
      }
    });

    return {
      free: true,
      subscriptionName: plan.name || plan.code,
      message: "Free plan activated"
    };
  }

  /* ======================================================
     PAID PLAN → CREATE RAZORPAY ORDER
  ====================================================== */

  const order = await razorpay.orders.create({
    amount: plan.price * 100,
    currency: "INR",
    receipt: `pl_${plan._id.toString().slice(-6)}_${Date.now()}`,
    notes: {
      planId: plan._id.toString(),
      userId,
      userType: plan.userType
    }
  });

  const orderNumber = await generateBusinessNumber("ORD");

  const payment = await Payment.create({
    userId,
    userType,
    planId: plan._id,
    orderNumber,
    amount: plan.price,
    razorpayOrderId: order.id,
    status: "created"
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID
  };
}

/* ======================================================
   VERIFY PAYMENT & ACTIVATE SUBSCRIPTION
====================================================== */

export async function verifyPaymentAndActivate(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  invoiceCustomer?: InvoiceCustomer,
): Promise<VerifyPaymentResult> {

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }


  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id
  });

  const invoiceNumber = await generateBusinessNumber("INV");


  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.status === "paid") {
    const existingPlan = await Plan.findById(payment.planId).lean();

    const resolvedName = existingPlan?.name || existingPlan?.code;
    return {
      success: true,
      alreadyPaid: true,
      ...(resolvedName && { subscriptionName: resolvedName }),
      message: "Payment already verified",
    };
  }


  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.invoiceNumber = invoiceNumber;


  await payment.save();

  const plan = await Plan.findById(payment.planId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  /* ======================================================
     EXPIRE OLD SUBSCRIPTIONS
  ====================================================== */

  await Subscription.updateMany(
    {
      userId: payment.userId,
      category: plan.category,
      status: "active"
    },
    { status: "expired" }
  );

  /* ======================================================
     GENERATE INVOICE
  ====================================================== */

  if (!payment.userId) {
    throw new Error("Invalid payment: userId missing");
  }

  const user = await User.findById(payment.userId).select("name phone").lean();

  const invoiceBuffer = await generateInvoicePdf({
      invoiceNo: invoiceNumber,
        orderNo: payment.orderNumber || "N/A",

    userName:
      invoiceCustomer?.name?.trim() ||
      user?.name?.trim() ||
      payment.userId.toString(),
    userPhone: invoiceCustomer?.phone || user?.phone,
    planName: plan.name || plan.code,
    amount: plan.price,
    date: new Date().toISOString().split("T")[0] || "",
  });

  const s3Key = `invoices/${payment.userId}/${payment._id}.pdf`;

  const invoiceUrl = await uploadPdfToS3(invoiceBuffer, s3Key);

  /* ======================================================
     CREATE NEW SUBSCRIPTION
  ====================================================== */

  const subscription = await Subscription.create({
    userId: payment.userId,
    userType: plan.userType,
    category: plan.category || "both",
    planCode: plan.code,
    tier: plan.tier,
    startDate: new Date(),
    endDate: new Date(
      Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
    ),
    status: "active",
    invoiceUrl,
    usage: {
      contactUsed: 0,
      enquiryUsed: 0
    }
  });

  /* ======================================================
     SAVE SUBSCRIPTION HISTORY
  ====================================================== */

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

    orderNumber: payment.orderNumber,
    invoiceNumber,
    invoiceUrl,
    purchasedAt: new Date()
  });

  console.log("✅ Subscription activated:", subscription._id);

  return {
    success: true,
    subscriptionName: plan.name || plan.code,
    invoiceUrl,
    message: "Payment verified & subscription activated"
  };
}
