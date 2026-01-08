import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import { SubscriptionLean } from "../types/subscriptionTypes";

export async function getMySubscription(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const subscriptions = await Subscription.find({
    userId,
    status: "active",
  }).lean<SubscriptionLean[]>();

  if (!subscriptions.length) {
    return res.json({ active: false, plans: [] });
  }

  const planCodes = subscriptions.map((s) => s.planCode);

  const plans = await Plan.find({ code: { $in: planCodes } }).lean();
  const planMap = new Map(plans.map((p) => [p.code, p]));

  const result = subscriptions.map((sub) => {
    const plan = planMap.get(sub.planCode);

    return {
      userType: sub.userType,
      category: sub.category || null,
      code: sub.planCode,
      tier: sub.tier,
      startDate: sub.startDate,
      endDate: sub.endDate,
      price: plan?.price,
      features: plan?.features,
      usage: sub.usage,
    };
  });

  res.json({ active: true, plans: result });
}
