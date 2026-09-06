import FeaturedProject from "../models/featurePropertiesModel";
import { CATEGORY_MODELS } from "../controller/listingPromotionController";

const ONE_HOUR_MS = 60 * 60 * 1000;
const PROMOTED_TYPES = ["featured", "sponsored", "prime"];

async function resetExpiredOnModel(Model: any, label: string) {
  const now = new Date();

  const expiredDocs = await Model.find({
    "promotion.type": { $in: PROMOTED_TYPES },
    $or: [
      { "promotion.boostExpiry": { $lte: now } },
      { "promotion.boostExpiry": { $exists: false } },
      { "promotion.boostExpiry": null },
    ],
  });

  for (const doc of expiredDocs) {
    const docAny = doc as any;
    const previousPromotion = docAny.promotion || {};
    const history = Array.isArray(docAny.promotionHistory)
      ? docAny.promotionHistory
      : [];
    const lastHistory = history[history.length - 1];

    if (lastHistory && !lastHistory.endedAt) {
      lastHistory.endedAt = now;
    }

    docAny.promotionHistory = history;
    docAny.lastPromotionType = previousPromotion.type || "normal";
    docAny.promotionHistory.push({
      fromType: previousPromotion.type || "normal",
      toType: "normal",
      source: "system",
      reason: "Promotion expired automatically",
      startedAt: now,
      endedAt: null,
      expiresAt: null,
      metadata: {
        previousPriority: previousPromotion.priority ?? 0,
        newPriority: 0,
      },
    });

    docAny.promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: now,
      visibleLeadLimit: 0,
    };
    docAny.markModified?.("promotion");

    await doc.save();
  }

  if (expiredDocs.length > 0) {
    console.log(
      `Reset ${expiredDocs.length} expired ${label} promotions to normal`,
    );
  }

  return expiredDocs.length;
}

export async function resetExpiredPromotions() {
  let total = 0;
  total += await resetExpiredOnModel(FeaturedProject, "project");

  for (const [category, Model] of Object.entries(CATEGORY_MODELS)) {
    total += await resetExpiredOnModel(Model, category);
  }

  return total;
}

export function startPromotionExpiryJob() {
  resetExpiredPromotions().catch((error) => {
    console.error("Promotion expiry cleanup failed:", error);
  });

  setInterval(() => {
    resetExpiredPromotions().catch((error) => {
      console.error("Promotion expiry cleanup failed:", error);
    });
  }, ONE_HOUR_MS);
}
