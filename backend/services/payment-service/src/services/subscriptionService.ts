// src/services/subscriptionService.ts
import { Types } from "mongoose";
import Plan from "../models/planModel";
import Subscription from "../models/subscriptionModel";
import razorpayClient from "../config/razorpayClient"; // no .js extension in TS imports
import { publishEvent } from "./eventPublisher";
import { ISubscription } from "../types/razorpay";

export interface CreateOrderInput {
  userId: string;
  planId: string;
  months?: number;
}

/** Minimal local typing for plan (lean result) */
interface PlanLean {
  planId: string;
  priceCents: number;
  currency?: string;
}

/** createOrder */
export async function createOrder(input: CreateOrderInput) {
  const months = input.months ?? 1;

  // use .lean() to get a plain object (easier typing)
  const plan = await Plan.findOne({ planId: input.planId }).lean<PlanLean | null>();
  if (!plan) throw new Error("Plan not found");

  const amount = plan.priceCents * months;
  const localSubId = `sub_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // razorpayClient is untyped; treat as any for the call
  const razorpay: any = razorpayClient;

  // Note: Razorpay's SDK may expect boolean for payment_capture — use `true` instead of 1
  const order = (await razorpay.orders.create({
    amount,
    currency: plan.currency ?? "INR",
    receipt: localSubId,
    payment_capture: true, // <- boolean avoids TS complaining about number -> boolean
  })) as any; // cast the returned order to any (safe until you add types)

  const subscription = await Subscription.create({
    subscriptionId: localSubId,
    userId: new Types.ObjectId(input.userId),
    planId: plan.planId,
    months,
    priceCents: amount,
    currency: plan.currency ?? "INR",
    status: "pending",
    providerData: { razorpayOrderId: order.id },
  } as Partial<ISubscription>);

  return {
    orderId: order.id as string,
    amount: order.amount as number,
    currency: order.currency as string,
    subscriptionId: subscription.subscriptionId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  };
}

/** Activate subscription by Razorpay order id (called from webhook) */
export async function activateSubscriptionByOrder(orderId: string, paymentEntity: any) {
  const sub = await Subscription.findOne({ "providerData.razorpayOrderId": orderId });
  if (!sub) throw new Error("Subscription not found");

  if (sub.status === "active") return sub;

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + (sub.months ?? 1));

  sub.status = "active";
  sub.periodStart = start;
  sub.periodEnd = end;
  sub.providerData = {
    ...sub.providerData,
    razorpayPaymentId: paymentEntity?.id,
    paymentPayload: paymentEntity,
  };

  await sub.save();

  await publishEvent("subscription.activated", {
    subscriptionId: sub.subscriptionId,
    userId: sub.userId.toString(),
    planId: sub.planId,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  });

  return sub;
}
