import FeaturedProject from "../models/featurePropertiesModel";

const ONE_HOUR_MS = 60 * 60 * 1000;
const PROMOTED_TYPES = ["featured", "sponsored", "prime"];

export async function resetExpiredPromotions() {
  const now = new Date();

  const expiredProjects = await FeaturedProject.find({
    "promotion.type": { $in: PROMOTED_TYPES },
    $or: [
      { "promotion.boostExpiry": { $lte: now } },
      { "promotion.boostExpiry": { $exists: false } },
      { "promotion.boostExpiry": null },
    ],
  });

  for (const project of expiredProjects) {
    const projectAny = project as any;
    const previousPromotion = projectAny.promotion || {};
    const history = Array.isArray(projectAny.promotionHistory)
      ? projectAny.promotionHistory
      : [];
    const lastHistory = history[history.length - 1];

    if (lastHistory && !lastHistory.endedAt) {
      lastHistory.endedAt = now;
    }

    projectAny.promotionHistory = history;
    projectAny.lastPromotionType = previousPromotion.type || "normal";
    projectAny.promotionHistory.push({
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

    projectAny.promotion = {
      type: "normal",
      priority: 0,
      source: "manual",
      startDate: now,
    };

    await project.save();
  }

  if (expiredProjects.length > 0) {
    console.log(`Reset ${expiredProjects.length} expired promotions to normal`);
  }
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
