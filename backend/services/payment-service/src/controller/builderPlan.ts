import { Request, Response } from "express";
import { Types } from "mongoose";
import { BuilderPlan } from "../models/builderPlanModel";

export async function getBuilderPlans(req: Request, res: Response) {
  try {
    const { promotionType, isActive, code } = req.query;

    const filter: Record<string, unknown> = {};

    if (promotionType) filter.promotionType = promotionType;
    if (code) filter.code = code;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const plans = await BuilderPlan.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch builder plans",
    });
  }
}

export async function getBuilderPlanById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder plan id is required",
      });
    }

    const plan = Types.ObjectId.isValid(id)
      ? await BuilderPlan.findById(id)
      : await BuilderPlan.findOne({ code: id });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Builder plan not found",
      });
    }

    return res.json({
      success: true,
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch builder plan",
    });
  }
}

export async function createBuilderPlan(req: Request, res: Response) {
  try {
    const plan = await BuilderPlan.create(req.body);

    res.status(201).json({
      success: true,
      message: "Builder plan created successfully",
      plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateBuilderPlan(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder plan id is required",
      });
    }

    const plan = Types.ObjectId.isValid(id)
      ? await BuilderPlan.findById(id)
      : await BuilderPlan.findOne({ code: id });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Builder plan not found",
      });
    }

    Object.assign(plan, req.body);
    await plan.save();

    return res.json({
      success: true,
      message: "Builder plan updated successfully",
      plan,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteBuilderPlan(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder plan id is required",
      });
    }

    const plan = Types.ObjectId.isValid(id)
      ? await BuilderPlan.findByIdAndDelete(id)
      : await BuilderPlan.findOneAndDelete({ code: id });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Builder plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Builder plan deleted successfully",
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete builder plan",
    });
  }
}
