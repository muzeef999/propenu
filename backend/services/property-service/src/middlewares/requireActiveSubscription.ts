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
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: userId, roleName } = req.user;

    console.log("👤 USER CONTEXT ----------------");
    console.log({
      userId,
      roleName,
    });

    const freeRoles = ["admin", "super_admin", "sales_agent", "sales_manager"];

    if (freeRoles.includes(roleName || "")) {
      return next(); // ✅ Skip subscription
    }

    const statusFromBody = req.body?.status;
    if (statusFromBody === "draft") {
      return next();
    }

    let listingType: string | undefined;

    if (req.params?.id) {
      const property = await Residential.findById(req.params.id).select(
        "listingType createdBy",
      );

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (String(property.createdBy) !== String(userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      listingType = property.listingType;
    }

    if (!listingType) {
      listingType = req.body?.listingType;
    }

    if (!listingType) {
      return res.status(400).json({ message: "listingType is required" });
    }

    // 🔥 STEP 1: Map listingType → plan category
    // const requiredCategory =
    //   listingType === "sale" ? "sell" : listingType === "rent" ? "rent" : null;

    const requiredCategory =
      listingType === "sale"
        ? "sell"
        : listingType === "rent"
          ? "rent"
          : listingType === "buy"
            ? "buy"
            : null;

    if (!requiredCategory) {
      return res.status(400).json({ message: "Invalid listingType" });
    }

    let userType: "buyer" | "agent" | "owner";

    // 🔥 FIX HERE
    if (roleName === "user")
      userType = "owner"; // ← change buyer → owner
    else if (roleName === "agent") userType = "agent";
    else if (roleName === "owner") userType = "owner";
    else if (roleName === "builder") userType = "owner";
    else {
      return res.status(403).json({ message: "Invalid user role" });
    }

    // console.log("🔎 DEBUG SUB CHECK ----------");
    // console.log({
    //   userId,
    //   roleName,
    //   userType,
    //   requiredCategory,
    // });

    // const allSubs = await Subscription.find({ userId }).lean();

    // console.log("📦 ALL USER SUBSCRIPTIONS:", allSubs);

    const subscription = await Subscription.findOne({
      userId,
      userType, // ✅ FIXED
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

    // 🔥 STEP 4: Check Property limit PROPERTY_LISTING_LIMIT
    const limit =
      typeof plan.features?.get("PROPERTY_LISTING_LIMIT") === "number"
        ? plan.features.get("PROPERTY_LISTING_LIMIT")
        : undefined;

    if (typeof limit === "number") {
      const [resCount, comCount, landCount, agriCount] = await Promise.all([
        Residential.countDocuments({
          createdBy: userId,
          status: "active",
          listingType,
        }),
        Commercial.countDocuments({
          createdBy: userId,
          status: "active",
          listingType,
        }),
        LandPlot.countDocuments({
          createdBy: userId,
          status: "active",
          listingType,
        }),
        Agricultural.countDocuments({
          createdBy: userId,
          status: "active",
          listingType,
        }),
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
