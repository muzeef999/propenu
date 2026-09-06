import { Response } from "express";
import mongoose, { Model } from "mongoose";
import { buildManualPromotion } from "../services/promotionService";
import { IPromotion } from "../models/sharedSchemas";
import { AuthRequest } from "../middlewares/authMiddleware";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";

type PromotionType = "normal" | "featured" | "sponsored" | "prime";

const ALLOWED_TYPES: PromotionType[] = [
  "normal",
  "featured",
  "sponsored",
  "prime",
];

const CATEGORY_MODELS: Record<string, Model<any>> = {
  residential: Residential as Model<any>,
  commercial: Commercial as Model<any>,
  land: LandPlot as Model<any>,
  agricultural: Agricultural as Model<any>,
};

function appendPromotionHistory(
  property: any,
  req: AuthRequest,
  promotion: IPromotion,
  reason: string,
) {
  const now = new Date();
  const previousPromotion = property.promotion || {};
  const fromType = (previousPromotion.type || "normal") as PromotionType;
  const toType = (promotion.type || "normal") as PromotionType;
  const history = Array.isArray(property.promotionHistory)
    ? property.promotionHistory
    : [];
  const lastHistory = history[history.length - 1];

  if (lastHistory && !lastHistory.endedAt) {
    lastHistory.endedAt = now;
  }

  const changedBy =
    req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : undefined;

  property.promotionHistory = history;
  property.lastPromotionType = fromType;
  property.promotionHistory.push({
    fromType,
    toType,
    source: promotion.source || "manual",
    changedBy,
    changedByRole: req.user?.roleName,
    reason,
    startedAt: promotion.startDate || now,
    endedAt: null,
    expiresAt: promotion.boostExpiry || null,
    metadata: {
      previousPriority: previousPromotion.priority ?? 0,
      newPriority: promotion.priority ?? 0,
    },
  });
}

function resolveModel(req: AuthRequest): Model<any> | null {
  const category = String(
    (req as any).params?.category ||
      (req as any).listingCategory ||
      "",
  )
    .trim()
    .toLowerCase();
  return CATEGORY_MODELS[category] || null;
}

/** Bind handlers to a fixed category (used from category routers). */
export function createListingPromotionHandlers(category: keyof typeof CATEGORY_MODELS) {
  const Model = CATEGORY_MODELS[category];
  if (!Model) {
    throw new Error(`Unknown listing category: ${category}`);
  }

  const withModel = (handler: (req: AuthRequest, res: Response, Model: Model<any>) => Promise<any>) => {
    return (req: AuthRequest, res: Response) => handler(req, res, Model);
  };

  return {
    promote: withModel(promoteListing),
    renew: withModel(renewListing),
    expire: withModel(expireListing),
    reset: withModel(resetListing),
  };
}

async function promoteListing(req: AuthRequest, res: Response, Model: Model<any>) {
  try {
    const { type, days, visibleLeadLimit } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion type",
      });
    }

    const property = await Model.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const promotion: IPromotion = buildManualPromotion(type);

    if (days != null && days !== "") {
      const n = Number(days);
      if (Number.isFinite(n) && n > 0) {
        promotion.boostExpiry = new Date(
          Date.now() + Math.trunc(n) * 24 * 60 * 60 * 1000,
        );
      }
    }

    const parsedLeadLimit = (() => {
      if (
        visibleLeadLimit === null ||
        visibleLeadLimit === undefined ||
        visibleLeadLimit === ""
      ) {
        return null;
      }
      const n = Number(visibleLeadLimit);
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.trunc(n);
    })();

    if (type === "normal") {
      promotion.visibleLeadLimit = 0;
    } else if (parsedLeadLimit !== null) {
      promotion.visibleLeadLimit = parsedLeadLimit;
    }

    appendPromotionHistory(
      property,
      req,
      promotion,
      `Promotion changed to ${promotion.type}`,
    );

    property.promotion = promotion as any;
    property.markModified("promotion");
    await property.save();

    return res.status(200).json({
      success: true,
      message: "Property promoted successfully",
      data: property,
    });
  } catch (err) {
    console.error("promoteListing error:", err);
    return res.status(500).json({
      success: false,
      message: "Promotion failed",
    });
  }
}

async function renewListing(req: AuthRequest, res: Response, Model: Model<any>) {
  try {
    const { type, days, visibleLeadLimit } = req.body;
    const renewalDays = typeof days === "number" ? days : 10;

    if (!Number.isFinite(renewalDays) || renewalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Renewal days must be a positive number",
      });
    }

    if (type && !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion type",
      });
    }

    const property = await Model.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const currentPromotion = (property.promotion || {}) as Partial<IPromotion>;
    const currentType = (currentPromotion.type || "normal") as PromotionType;
    const nextType = (type || currentType) as PromotionType;

    if (nextType === "normal") {
      return res.status(400).json({
        success: false,
        message: "Promotion type is required to renew a normal promotion",
      });
    }

    const now = new Date();
    const currentExpiry = currentPromotion.boostExpiry
      ? new Date(currentPromotion.boostExpiry)
      : null;
    const baseDate =
      currentExpiry && currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;

    const promotion: IPromotion = {
      ...buildManualPromotion(nextType),
      startDate: now,
      boostExpiry: new Date(
        baseDate.getTime() + renewalDays * 24 * 60 * 60 * 1000,
      ),
    };

    if (typeof visibleLeadLimit === "number" && visibleLeadLimit >= 0) {
      promotion.visibleLeadLimit = visibleLeadLimit;
    } else if (
      visibleLeadLimit !== undefined &&
      visibleLeadLimit !== null &&
      visibleLeadLimit !== ""
    ) {
      const parsed = Number(visibleLeadLimit);
      if (Number.isFinite(parsed) && parsed >= 0) {
        promotion.visibleLeadLimit = Math.trunc(parsed);
      } else if (typeof currentPromotion.visibleLeadLimit === "number") {
        promotion.visibleLeadLimit = currentPromotion.visibleLeadLimit;
      }
    } else if (typeof currentPromotion.visibleLeadLimit === "number") {
      promotion.visibleLeadLimit = currentPromotion.visibleLeadLimit;
    }

    appendPromotionHistory(
      property,
      req,
      promotion,
      `Promotion renewed for ${renewalDays} day${renewalDays === 1 ? "" : "s"}`,
    );

    property.promotion = promotion as any;
    property.markModified("promotion");
    await property.save();

    return res.status(200).json({
      success: true,
      message: "Promotion renewed successfully",
      data: property,
    });
  } catch (err) {
    console.error("renewListing error:", err);
    return res.status(500).json({
      success: false,
      message: "Promotion renewal failed",
    });
  }
}

async function expireListing(req: AuthRequest, res: Response, Model: Model<any>) {
  try {
    const property = await Model.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!property.promotion) {
      return res.status(400).json({
        message: "No promotion found for this property",
      });
    }

    const promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: new Date(),
      visibleLeadLimit: 0,
    } as IPromotion;

    appendPromotionHistory(property, req, promotion, "Promotion expired manually");
    property.promotion = promotion as any;
    property.markModified("promotion");
    await property.save();

    return res.json({
      success: true,
      message: "Promotion expired and reset to normal",
      data: property,
    });
  } catch (err) {
    console.error("expireListing error:", err);
    return res.status(500).json({ message: "Expire failed" });
  }
}

async function resetListing(req: AuthRequest, res: Response, Model: Model<any>) {
  try {
    const property = await Model.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: new Date(),
      visibleLeadLimit: 0,
    } as IPromotion;

    appendPromotionHistory(property, req, promotion, "Promotion reset to normal");
    property.promotion = promotion as any;
    property.markModified("promotion");
    await property.save();

    return res.json({
      success: true,
      message: "Reset to normal",
      data: property,
    });
  } catch (err) {
    return res.status(500).json({ message: "Reset failed" });
  }
}

export { resolveModel, CATEGORY_MODELS };
