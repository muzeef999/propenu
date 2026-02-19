// src/controllers/analyticsController.ts

import { Response } from "express";
import mongoose from "mongoose";
import Residential from "../models/residentialModel";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";

/* =====================================================
   HELPER
===================================================== */

async function propertyStats(match: any = {}) {
  const stats = await Residential.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },

        active: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },

        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },

        draft: {
          $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
        },

        totalViews: { $sum: "$meta.views" },
      },
    },
  ]);

  return stats[0] || {
    totalProperties: 0,
    active: 0,
    pending: 0,
    draft: 0,
    totalViews: 0,
  };
}

/* =====================================================
   1️⃣ SUPER ADMIN All platform stats
===================================================== */

export const getSuperAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.countDocuments();
    const agents = await User.countDocuments({ roleName: "sales_agent" });
    const managers = await User.countDocuments({ roleName: "sales_manager" });

    const properties = await propertyStats();

    res.json({
      users,
      agents,
      managers,
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   2️⃣ ADMIN Same as super admin but without users
===================================================== */

export const getAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await propertyStats();

    res.json({
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   3️⃣ SALES MANAGER  Properties of agents under manager
===================================================== */

export const getsupermanager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const managerId = new mongoose.Types.ObjectId(req.user!.id);

    const agents = await User.find({ managerId }).select("_id");

    const agentIds = agents.map((a) => a._id);

    const properties = await propertyStats({
      createdBy: { $in: agentIds },
    });

    res.json({
      totalAgents: agents.length,
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   4️⃣ SALES AGENT   Only his properties
===================================================== */

export const getsuperagent = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const agentId = new mongoose.Types.ObjectId(req.user!.id);

    const properties = await propertyStats({
      createdBy: agentId,
    });

    res.json(properties);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
