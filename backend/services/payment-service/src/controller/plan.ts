import { Request, Response } from "express";
import { Plan } from "../models/planModel";
import { Subscription } from "../models/subscriptionModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";
import { AuthRequest } from "../middlewares/authMiddleware";

/* ---------------- GET PLANS ---------------- */

export async function getPlans(req: Request, res: Response) {
  try {
    const { userType, category } = req.query;

    const filter: any = {};
    if (userType) filter.userType = userType;
    if (category) filter.category = category;

    const plans = await Plan.find(filter).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch plans" });
  }
}

/* ---------------- ASSIGN PLAN (IMPORTANT) ---------------- */

export const assignPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, planCode } = req.body;

    if (!userId || !planCode) {
      return res.status(400).json({
        success: false,
        message: "userId and planCode are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1️⃣ Find plan
    const plan = await Plan.findOne({ code: planCode });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // 2️⃣ Calculate dates ONCE
    const startDate = new Date();
    const endDate = new Date(
      Date.now() + (plan.durationDays ?? 30) * 24 * 60 * 60 * 1000,
    );

    // 3️⃣ Expire existing active subscriptions
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "expired" },
    );
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userType = req.user.roleName;

    // 4️⃣ Create new subscription
    const subscription = await Subscription.create({
      userId,
      userType,
      category: plan.category || "both",
      planCode: plan.code,
      tier: plan.tier,
      startDate,
      endDate,
      status: "active",
      usage: {
        contactUsed: 0,
        enquiryUsed: 0,
      },
    });

    // 5️⃣ CREATE SUBSCRIPTION HISTORY (THIS IS THE FIX)
    const history = await SubscriptionHistory.create({
      userId,
      userType,
      planCode: plan.code,
      tier: plan.tier,
      category: plan.category,
      price: plan.price,
      status: "active",
      startDate,
      endDate,
      purchasedAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Plan assigned successfully",
      subscription,
      history,
    });
  } catch (error) {
    console.error("❌ assignPlan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign plan",
    });
  }
};

/* ---------------- CREATE PLAN ---------------- */

export const createPlan = async (req: Request, res: Response) => {
  try {
    const plan = await Plan.create(req.body);

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- UPDATE PLAN ---------------- */

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const plan = await Plan.findOneAndUpdate(
      { code },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
