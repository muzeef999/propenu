import FeaturedProject from "../models/featurePropertiesModel";

const ONE_HOUR_MS = 60 * 60 * 1000;
const PROMOTED_TYPES = ["featured", "sponsored", "prime"];

export async function resetExpiredPromotions() {
  const now = new Date();

  const result = await FeaturedProject.updateMany(
    {
      "promotion.type": { $in: PROMOTED_TYPES },
      $or: [
        { "promotion.boostExpiry": { $lte: now } },
        { "promotion.boostExpiry": { $exists: false } },
        { "promotion.boostExpiry": null },
      ],
    },
    {
      $set: {
        "promotion.type": "normal",
        "promotion.priority": 0,
        "promotion.source": "manual",
        "promotion.startDate": now,
      },
      $unset: {
        "promotion.boostExpiry": "",
        "promotion.enquiryLimit": "",
        "promotion.enquiriesUsed": "",
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.log(`Reset ${result.modifiedCount} expired promotions to normal`);
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
