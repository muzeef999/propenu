import { Payment } from "../models/paymentModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { Subscription } from "../models/subscriptionModel";

const parseDayBound = (value: unknown, endOfDay = false) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(
      `${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`,
    );
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildCreatedAtMatch = (query: Record<string, any> = {}) => {
  const from = parseDayBound(query.from || query.startDate || query.createdFrom, false);
  const to = parseDayBound(query.to || query.endDate || query.createdTo, true);
  if (!from && !to) return {};
  const createdAt: Record<string, Date> = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return { createdAt };
};

const boundedPage = (value: unknown, fallback = 1) =>
  Math.max(1, Number(value) || fallback);

const boundedLimit = (value: unknown, fallback = 20, max = 100) =>
  Math.min(max, Math.max(1, Number(value) || fallback));

export const getAccountsSummary = async (query: Record<string, any> = {}) => {
  const rangeMatch = buildCreatedAtMatch(query);
  const todayIst = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  const todayStart = new Date(`${todayIst}T00:00:00.000+05:30`);
  const todayEnd = new Date(`${todayIst}T23:59:59.999+05:30`);

  const [lifetimeAgg, periodAgg, todayAgg, activeSubs, periodStartedSubs, failedPayments] =
    await Promise.all([
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
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Current live subscriptions — status only, not created-in-period.
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "active", ...rangeMatch }),
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
    periodStartedSubscriptions: periodStartedSubs,
    failedPayments,
  };
};

export const getPayments = async (query: any) => {
  const { status, userType, userId } = query;
  const page = boundedPage(query.page);
  const limit = boundedLimit(query.limit);
  const filter: any = {
    ...buildCreatedAtMatch(query),
  };
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  if (userType) filter.userType = userType;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("planId", "name tier price")
      .populate("userId", "name email phone locality city state pincode address")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    data: payments,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit) || 1),
  };
};

export const getSubscriptions = async (query: any) => {
  const { status } = query;
  const page = boundedPage(query.page);
  const limit = boundedLimit(query.limit, 50);

  const filter: any = {
    ...buildCreatedAtMatch(query),
  };
  if (status) filter.status = status;

  return Subscription.find(filter)
    .populate("userId", "name email phone locality city state pincode address")
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
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
