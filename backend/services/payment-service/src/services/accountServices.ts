import { Payment } from "../models/paymentModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { Subscription } from "../models/subscriptionModel";

const parseDayBound = (value: unknown, endOfDay = false) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  const date = new Date(
    raw.includes("T") ? raw : `${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildCreatedAtMatch = (query: Record<string, any> = {}) => {
  const from = parseDayBound(query.from, false);
  const to = parseDayBound(query.to, true);
  if (!from && !to) return {};
  const createdAt: Record<string, Date> = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return { createdAt };
};

export const getAccountsSummary = async (query: Record<string, any> = {}) => {
  const rangeMatch = buildCreatedAtMatch(query);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [lifetimeAgg, periodAgg, todayAgg, activeSubs, failedPayments] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "paid", ...rangeMatch } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Subscription.countDocuments({ status: "active" }),
    Payment.countDocuments({ status: "failed", ...rangeMatch }),
  ]);

  const lifetimeRevenue = lifetimeAgg[0]?.total || 0;
  const periodRevenue = periodAgg[0]?.total || 0;

  return {
    totalRevenue: Object.keys(rangeMatch).length ? periodRevenue : lifetimeRevenue,
    lifetimeRevenue,
    periodRevenue,
    todayRevenue: todayAgg[0]?.total || 0,
    activeSubscriptions: activeSubs,
    failedPayments,
  };
};

export const getPayments = async (query: any) => {
  const { status, userType, userId, page = 1, limit = 20 } = query;
  const filter: any = {
    ...buildCreatedAtMatch(query),
  };
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

  const filter: any = {
    ...buildCreatedAtMatch(query),
  };
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

export const getRevenueByPlan = async (query: Record<string, any> = {}) => {
  const rangeMatch = buildCreatedAtMatch(query);
  return Payment.aggregate([
    { $match: { status: "paid", ...rangeMatch } },
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
