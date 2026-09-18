import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import Lead from "../models/LeadModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";

const PROPERTY_MODEL_MAP: Record<string, any> = {
  residentials: Residential,
  commercials: Commercial,
  agriculturals: Agricultural,
  landplots: LandPlot,
};

function isAgentRole(value?: string | null) {
  return String(value || "").trim().toLowerCase() === "agent";
}

async function isAgentListedProperty(
  propertyType?: string,
  projectId?: string,
  listingSource?: string,
) {
  if (isAgentRole(listingSource)) return true;
  if (!propertyType || !projectId) return false;

  const PropertyModel = PROPERTY_MODEL_MAP[propertyType];
  if (!PropertyModel) return false;

  const property = await PropertyModel.findById(projectId)
    .select("listingSource createdBy")
    .populate({
      path: "createdBy",
      select: "roleName role roleId",
      populate: {
        path: "roleId",
        select: "name label",
      },
    })
    .lean();

  if (!property) return false;

  const createdBy = (property as any).createdBy;
  const roleDoc = createdBy?.roleId;

  return (
    isAgentRole((property as any).listingSource) ||
    isAgentRole(createdBy?.roleName) ||
    isAgentRole(createdBy?.role) ||
    isAgentRole(roleDoc?.name) ||
    isAgentRole(roleDoc?.label)
  );
}

// ===================================================== CONTACT OWNER LIMIT MIDDLEWARE ======================================================

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
    const { propertyType, projectId, listingSource } = req.body;

    if (propertyType === "featuredprojects") return next();

    if (await isAgentListedProperty(propertyType, projectId, listingSource)) {
      return next();
    }

    // admin skip
    const freeRoles = ["admin", "super_admin", "builder"];
    if (freeRoles.includes(roleName || "")) return next();

    // 1️⃣ get active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: new Date() }, // ✅ important
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
    const planLimit =
      typeof plan.features?.get("CONTACT_OWNER_LIMIT") === "number"
        ? plan.features.get("CONTACT_OWNER_LIMIT")
        : typeof plan.features?.get("CONTACT_LIMIT") === "number"
          ? plan.features.get("CONTACT_LIMIT")
          : undefined;
    const limit = subscription.usage?.contactLimit ?? planLimit;

    if (typeof limit === "number") {
      // IMPORTANT: change field if your Lead schema different
      const used = await Lead.countDocuments({
        createdBy: userId,
        createdAt: { $gte: subscription.createdAt }, // ✅ fix
      });


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
