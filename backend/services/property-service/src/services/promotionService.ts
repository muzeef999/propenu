type PromotionType = "normal" | "featured" | "sponsored" | "prime";

const PRIORITY: Record<PromotionType, number> = {
  normal: 0,
  featured: 1,
  sponsored: 2,
  prime: 3
};

export function buildManualPromotion(type: PromotionType) {
  return {
    type,
    priority: PRIORITY[type],
    source: "manual" as const, // 🔥 FIX TypeScript error
    startDate: new Date(),
    boostExpiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  };
}
export function buildPromotionFromPlan(plan: any) {
  const type: PromotionType =
    plan?.features?.PROMOTION_TYPE || "normal";

  return {
    type,
    priority: PRIORITY[type],
    source: "subscription" as const, // ✅ FIX
    startDate: new Date(),
    boostExpiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    enquiryLimit: plan?.features?.ENQUIRY_LIMIT || 0,
    enquiriesUsed: 0
  };
}