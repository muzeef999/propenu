import mongoose, { Schema, Document, Model } from "mongoose";


export interface IPlan extends Document {
  planId: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  active: boolean;
}

export type SubscriptionStatus = "pending" | "active" | "inactive" | "cancelled" | "expired" | "failed";


export interface ISubscription extends Document {
  subscriptionId: string;
  userId: mongoose.Types.ObjectId;
  planId: string;
  months: number;
  priceCents: number;
  currency: string;
  status: SubscriptionStatus;
  periodStart?: Date;
  periodEnd?: Date;
  providerData: Record<string, any>;
}