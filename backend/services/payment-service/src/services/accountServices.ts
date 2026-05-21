import { Payment } from "../models/paymentModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { Subscription } from "../models/subscriptionModel";

export const getAccountsSummary = async () => {
  const [revenueAgg, todayAgg, activeSubs, failedPayments] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    Subscription.countDocuments({ status: "active" }),

    Payment.countDocuments({ status: "failed" }),
  ]);

  return {
    totalRevenue: revenueAgg[0]?.total || 0,
    todayRevenue: todayAgg[0]?.total || 0,
    activeSubscriptions: activeSubs,
    failedPayments,
  };
};

export const getPayments = async (query: any) => {
  const { status, userType,userId, page = 1, limit = 20 } = query;


  const filter: any = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  if (userType) filter.userType = userType;

  const payments = await Payment.find(filter)
    .populate("planId", "name tier price")
    .populate("userId", "name email phone locality city state pincode address")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Payment.countDocuments(filter);

  return { data: payments, total };
};

export const getSubscriptions = async (query: any) => {
  const { status } = query;

  const filter: any = {};
  if (status) filter.status = status;

  return Subscription.find(filter)
    .populate("userId", "name email phone locality city state pincode address")
    .sort({ createdAt: -1 });
};

export const getSubscriptionHistoryone = async (query: any) => {
  const { userId } = query;

  const filter: any = {};
  if (userId) filter.userId = userId;

  return SubscriptionHistory.find(filter)
    .populate("userId", "name email phone locality city state pincode address")
    .sort({
      purchasedAt: -1,
    });
};

export const getRevenueByPlan = async () => {
  return Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$planId",
        totalRevenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "plans",
        localField: "_id",
        foreignField: "_id",
        as: "plan",
      },
    },
    { $unwind: "$plan" },
  ]);
};
