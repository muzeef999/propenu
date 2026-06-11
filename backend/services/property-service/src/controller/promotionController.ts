// src/controller/promotionController.ts

import { Request, Response } from "express";
import FeaturedProject from "../models/featurePropertiesModel";
import { buildManualPromotion } from "../services/promotionService";
import { IPromotion } from "../models/sharedSchemas";

type PromotionType = "normal" | "featured" | "sponsored" | "prime";

const ALLOWED_TYPES: PromotionType[] = [
  "normal",
  "featured",
  "sponsored",
  "prime",
];

export const promoteProperty = async (req: Request, res: Response) => {
  try {
    const { type, days } = req.body;

    // ✅ 1. VALIDATION
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid promotion type",
      });
    }

    // ✅ 2. FIND PROPERTY
    const property = await FeaturedProject.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // ✅ 3. BUILD PROMOTION
    const promotion: IPromotion = buildManualPromotion(type);
  
    // ✅ 4. OPTIONAL CUSTOM DAYS
    if (days && typeof days === "number") {
      promotion.boostExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // ✅ 5. SAFE MERGE (VERY IMPORTANT)
    property.promotion = promotion as any;

    // ✅ 6. SAVE
    await property.save();

    return res.status(200).json({
      success: true,
      message: "Property promoted successfully",
      data: property,
    });
  } catch (err) {
    console.error("❌ promoteProperty error:", err);
    return res.status(500).json({
      success: false,
      message: "Promotion failed",
    });
  }
};

export const expirePromotion = async (req: Request, res: Response) => {
  try {
    const property = await FeaturedProject.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // ✅ 1. CHECK IF PROMOTION EXISTS
    if (!property.promotion) {
      return res.status(400).json({
        message: "No promotion found for this property",
      });
    }

    // ✅ 2. EXPIRE
    property.promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: new Date(),
    } as any;

    await property.save();

    return res.json({
      success: true,
      message: "Promotion expired and reset to normal",
    });
  } catch (err) {
    console.error("❌ expirePromotion error:", err);
    res.status(500).json({ message: "Expire failed" });
  }
};

export const resetPromotion = async (req: Request, res: Response) => {
  try {
    const property = await FeaturedProject.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: new Date(),
    };

    await property.save();

    res.json({ success: true, message: "Reset to normal" });
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
};
