import { Types } from "mongoose";

export interface SubscriptionLean {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userType: "builder" | "buyer" | "agent" | "owner";
  planCode: string;
  tier: string;
  category?: "rent" | "sell" | "both";
  status: "active" | "expired" | "cancelled" | "pending";
  startDate?: Date;
  endDate?: Date;

  usage?: {
    contactUsed: number;
    enquiryUsed: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
