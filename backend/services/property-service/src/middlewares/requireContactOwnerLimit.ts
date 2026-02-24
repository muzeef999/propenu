import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import Lead from "../models/LeadModel";


// ======================================================
// CONTACT OWNER LIMIT MIDDLEWARE
// ======================================================
export const requireContactOwnerLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: userId, roleName } = req.user;

    // admin skip
    const freeRoles = ["admin", "super_admin"];
    if (freeRoles.includes(roleName || "")) return next();

    // 1️⃣ get active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Please subscribe to contact owners",
      });
    }

    // 2️⃣ get plan
    const plan = await Plan.findOne({ code: subscription.planCode });

    if (!plan) {
      return res.status(403).json({ message: "Invalid plan" });
    }

    // 3️⃣ check contact limit
    const limit =
      typeof plan.features?.get("CONTACT_OWNER_LIMIT") === "number"
        ? plan.features.get("CONTACT_OWNER_LIMIT")
        : undefined;

    if (typeof limit === "number") {
      // IMPORTANT: change field if your Lead schema different
      const used = await Lead.countDocuments({ userId });

      if (used >= limit) {
        return res.status(403).json({
          success: false,
          code: "CONTACT_LIMIT_REACHED",
          message: `Your plan allows only ${limit} owner contacts. Please upgrade.`,
        });
      }
    }

    next();
  } catch (err) {
    console.error("requireContactOwnerLimit error:", err);
    return res.status(500).json({ message: "Contact limit check failed" });
  }
};