import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.id;

  const { listingType } = req.body; // "sale" | "rent" | "lease"


  // 1️⃣ Check active subscription
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  });

  if (!subscription) {
    return res.status(403).json({
      message: "Please subscribe to post properties",
    });
  }

  // 2️⃣ Load plan
  const plan = await Plan.findOne({
    code: subscription.planCode,
  });

  if (!plan) {
    return res.status(403).json({
      message: "Invalid subscription plan",
    });
  }

    // 2.5️⃣ Check if plan allows this listing type (sale / rent)
  const requiredCategory =
    listingType === "sale" ? "sell" : "rent";

  if (
    plan.category !== "both" &&
    plan.category !== requiredCategory
  ) {
    return res.status(403).json({
      message: `Your current plan does not allow posting ${listingType} properties. Please upgrade your plan.`,
    });
  }

  // 3️⃣ Check property listing limit
const limit =
  typeof plan.features?.get("PROPERTY_LISTING_LIMIT") === "number"
    ? plan.features.get("PROPERTY_LISTING_LIMIT")
    : undefined;


    const [residentialCount, commercialCount, landCount, agriculturalCount] =
  await Promise.all([
    Residential.countDocuments({ createdBy: userId, status: "active" }),
    Commercial.countDocuments({ createdBy: userId, status: "active" }),
    LandPlot.countDocuments({ createdBy: userId, status: "active" }),
    Agricultural.countDocuments({ createdBy: userId, status: "active" }),
  ]);

const activeCount =
  residentialCount +
  commercialCount +
  landCount +
  agriculturalCount;



   if (typeof limit === "number" && activeCount >= limit) {
    return res.status(403).json({
      message: `Property limit reached (${limit}). Upgrade your plan.`,
    });
  }

  // ✅ All checks passed
  next();
};
