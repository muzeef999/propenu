import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";

import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";

export async function getMySubscription(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const subscriptions = await Subscription.find({
    userId,
    status: "active",
  }).lean();

  if (!subscriptions.length) {
    return res.json({ active: false, plans: [] });
  }

  const planCodes = subscriptions.map((s) => s.planCode);
  const plans = await Plan.find({ code: { $in: planCodes } }).lean();
  const planMap = new Map(plans.map((p) => [p.code, p]));

  // ✅ count properties ONCE
  const [sellCount, rentCount] = await Promise.all([
    Promise.all([
      Residential.countDocuments({ createdBy: userId, listingType: "sale" }),
      Commercial.countDocuments({ createdBy: userId, listingType: "sale" }),
      LandPlot.countDocuments({ createdBy: userId, listingType: "sale" }),
      Agricultural.countDocuments({ createdBy: userId, listingType: "sale" }),
    ]).then((r) => r.reduce((a, b) => a + b, 0)),

    Promise.all([
      Residential.countDocuments({ createdBy: userId, listingType: "rent" }),
      Commercial.countDocuments({ createdBy: userId, listingType: "rent" }),
      LandPlot.countDocuments({ createdBy: userId, listingType: "rent" }),
      Agricultural.countDocuments({ createdBy: userId, listingType: "rent" }),
    ]).then((r) => r.reduce((a, b) => a + b, 0)),
  ]);

  const result = subscriptions.map((sub) => {
    const plan: any = planMap.get(sub.planCode);
    if (!plan) return null;

    let total = 0;
    let used = 0;
    let unit = "features";

    // 🏠 OWNER → PROPERTY PLANS
    if (
      plan.userType === "owner" &&
      typeof plan.features?.PROPERTY_LISTING_LIMIT === "number"
    ) {
      total = plan.features.PROPERTY_LISTING_LIMIT;
      used = sub.category === "sell" ? sellCount : rentCount;
      unit = "properties";
    }

    // 👤 BUYER → CONTACT PLANS
    if (plan.features?.CONTACT_OWNER_LIMIT) {
      total = plan.features.CONTACT_OWNER_LIMIT;
      used = (sub as any).usage?.contactUsed || 0;
      unit = "contacts";
    }

    return {
      userType: sub.userType,
      category: sub.category,
      code: sub.planCode,
      tier: sub.tier,
      planName: plan.name || plan.title || sub.planCode,
      total,
      used,
      remaining: Math.max(total - used, 0),
      unit,
      startDate: sub.startDate,
      endDate: sub.endDate,
    };
  });

  res.json({
    active: true,
    plans: result.filter(Boolean),
  });
}

export async function getSubscriptionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const history = await SubscriptionHistory.find({ userId })
      .sort({ purchasedAt: -1 })
      .lean();

    if (!history.length) {
      return res.json({
        success: true,
        history: [],
      });
    }

    const planCodes = [...new Set(history.map((h) => h.planCode))];
    const plans = await Plan.find({ code: { $in: planCodes } }).lean();
    const planMap = new Map(plans.map((p) => [p.code, p]));

    // 3️⃣ Shape response for UI
    const result = history.map((item) => {
      const plan: any = planMap.get(item.planCode);

      return {
        planCode: item.planCode,
        planName: plan?.name || item.planCode,
        tier: item.tier,
        category: item.category,
        price: item.price,
        status: item.status, // active | expired | cancelled
        startDate: item.startDate,
        endDate: item.endDate,
        purchasedAt: item.purchasedAt,
      };
    });

    res.json({
      success: true,
      history: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch subscription history",
      });
  }
}
