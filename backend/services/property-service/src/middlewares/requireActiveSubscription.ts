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
  try {
    const userId = req.user!.id;
    const { listingType } = req.body; // "sale" | "rent"

    if (!listingType) {
      return res.status(400).json({ message: "listingType is required" });
    }

    // 🔥 STEP 1: Map listingType → plan category
    const requiredCategory =
      listingType === "sale" ? "sell" :
      listingType === "rent" ? "rent" :
      null;

    if (!requiredCategory) {
      return res.status(400).json({ message: "Invalid listingType" });
    }

    // 🔥 STEP 2: Find ACTIVE subscription for THIS category
    const subscription = await Subscription.findOne({
      userId,
      userType: "owner",
      category: requiredCategory,
      status: "active",
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        code: "NO_VALID_PLAN",
        message: `You don’t have an active ${requiredCategory} plan. Please subscribe.`,
      });
    }

    // 🔥 STEP 3: Load plan
    const plan = await Plan.findOne({ code: subscription.planCode });

    if (!plan) {
      return res.status(403).json({ message: "Invalid subscription plan" });
    }

    // 🔥 STEP 4: Check PROPERTY_LISTING_LIMIT
    const limit =
      typeof plan.features?.get("PROPERTY_LISTING_LIMIT") === "number"
        ? plan.features.get("PROPERTY_LISTING_LIMIT")
        : undefined;

    if (typeof limit === "number") {
      const [resCount, comCount, landCount, agriCount] = await Promise.all([
        Residential.countDocuments({ createdBy: userId, status: "active", listingType }),
        Commercial.countDocuments({ createdBy: userId, status: "active", listingType }),
        LandPlot.countDocuments({ createdBy: userId, status: "active", listingType }),
        Agricultural.countDocuments({ createdBy: userId, status: "active", listingType }),
      ]);

      const activeCount = resCount + comCount + landCount + agriCount;

      if (activeCount >= limit) {
        return res.status(403).json({
          success: false,
          code: "PLAN_LIMIT_REACHED",
          action: "UPGRADE_REQUIRED",
          feature: "PROPERTY_LISTING_LIMIT",
          message: `Your ${requiredCategory} plan limit is reached (${limit}). Please upgrade.`,
        });
      }
    }

    // ✅ STEP 5: allow post
    next();
  } catch (err) {
    console.error("requireActiveSubscription error:", err);
    return res.status(500).json({ message: "Subscription validation failed" });
  }
};
