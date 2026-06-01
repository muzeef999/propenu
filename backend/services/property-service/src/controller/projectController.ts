import { Response, Request } from "express";
import FeaturedProject from "../models/featurePropertiesModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import mongoose from "mongoose";

export const getPendingProjects = async (req: AuthRequest, res: Response) => {
  try {
    // allow only manager/admin
    if (
      !req.user ||
      !["sales_manager", "admin", "super_admin"].includes(
        req.user.roleName || "",
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const projects = await FeaturedProject.find({
      approvalStatus: "pending",
      status: "pending",
    })
      .populate("createdBy", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: projects.length,
      data: projects,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveProject = async (req: AuthRequest, res: Response) => {
  try {
    // allow only manager/admin
    if (
      !req.user ||
      !["sales_manager", "admin", "super_admin"].includes(
        req.user.roleName || "",
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const project = await FeaturedProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // approve project
    project.status = "active";

    project.approvalStatus = "approved";

    project.approvedBy = new mongoose.Types.ObjectId(req.user.id);

    project.approvedAt = new Date();

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project approved successfully",
      data: project,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectProject = async (req: AuthRequest, res: Response) => {
  try {
    if (
      !req.user ||
      !["sales_manager", "admin", "super_admin"].includes(
        req.user.roleName || "",
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { reason } = req.body;

    const project = await FeaturedProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.status = "rejected";

    project.approvalStatus = "rejected";

    project.rejectedReason = reason || "Rejected by manager";

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project rejected successfully",
      data: project,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
