import { Request, Response } from "express";
import { Plan } from "../models/planModel";
import { Subscription } from "../models/subscriptionModel";

export async function getPlans(req: Request, res: Response) {
  const { userType, category } = req.query;

  const filter: any = {};
  if (userType) filter.userType = userType;
  if (category) filter.category = category;

  const plans = await Plan.find(filter).sort({ price: 1 });
  res.json(plans);
}

export const assignPlan = async (req: Request, res: Response) => {
  try {
    const { userId, planCode } = req.body;

    if (!userId || !planCode) {
      return res.status(400).json({
        message: "userId and planCode are required",
      });
    }

    // 1️⃣ Validate plan
    const plan = await Plan.findOne({ code: planCode });

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    // 2️⃣ Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan.durationDays ?? 30));

    // 3️⃣ Expire old subscription
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "expired" },
    );

    // 4️⃣ Create new subscription
    const subscription = await Subscription.create({
      userId,
      planCode,
      startDate,
      endDate,
      status: "active",
    });

    res.json({
      success: true,
      message: "Plan assigned successfully",
      subscription,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign plan",
    });
  }
};

// ---------------- ADD PLAN ----------------
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

// ---------------- EDIT PLAN ----------------

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
        message: "Plan not found",
      });
    }

    res.json({ success: true, message: "Plan updated successfully", plan });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
