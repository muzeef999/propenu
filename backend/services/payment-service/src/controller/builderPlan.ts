import { Request, Response } from "express";
import { Types } from "mongoose";
import { BuilderPlan } from "../models/builderPlanModel";
import User from "../../../user-service/src/models/userModel";
import FeaturedProject from "../../../user-service/src/models/featurePropertiesModel";

function getRoleNameFromUser(user: any) {
  const role = user?.roleId;

  if (!role) return undefined;
  if (typeof role === "string") return undefined;
  if (typeof role?.name === "string") return role.name.toLowerCase();

  return undefined;
}

async function validateBuilderAndProject(params: {
  builder?: string;
  project?: string;
}) {
  const { builder, project } = params;

  if (!builder || !Types.ObjectId.isValid(builder)) {
    return { ok: false, status: 400, message: "A valid builder id is required" };
  }

  if (!project || !Types.ObjectId.isValid(project)) {
    return { ok: false, status: 400, message: "A valid project id is required" };
  }

  const builderUser = await User.findById(builder).populate("roleId", "name");

  if (!builderUser) {
    return { ok: false, status: 404, message: "Builder user not found" };
  }

  const roleName = getRoleNameFromUser(builderUser);

  if (roleName !== "builder") {
    return { ok: false, status: 400, message: "Selected user is not a builder" };
  }

  const projectDoc = await FeaturedProject.findById(project).select("createdBy title");

  if (!projectDoc) {
    return { ok: false, status: 404, message: "Project not found" };
  }

  if (String(projectDoc.createdBy) !== String(builderUser._id)) {
    return {
      ok: false,
      status: 400,
      message: "Selected project does not belong to the selected builder",
    };
  }

  return { ok: true };
}

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
    const validation = await validateBuilderAndProject({
      builder: req.body?.builder,
      project: req.body?.project,
    });

    if (!validation.ok) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
      });
    }

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

    const nextBuilder = req.body?.builder ?? String((plan as any).builder);
    const nextProject = req.body?.project ?? String((plan as any).project);

    const validation = await validateBuilderAndProject({
      builder: nextBuilder,
      project: nextProject,
    });

    if (!validation.ok) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
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
