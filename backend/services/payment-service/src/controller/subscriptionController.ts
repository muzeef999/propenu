import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";

export async function getMySubscription(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  });

  if (!subscription) {
    return res.json({
      active: false,
      message: "No active subscription",
    });
  }

  const plan = await Plan.findOne({
    code: subscription.planCode,
  });

  res.json({
    active: true,
    plan: {
      code: subscription.planCode,
      tier: subscription.tier,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      price: plan?.price,
      features: plan?.features,
    },
  });
}
