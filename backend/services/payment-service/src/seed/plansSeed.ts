import { PLAN_FEATURES } from "../constants/planFeatures";

export const plans = [
  // ================= BUYER =================
  {
    code: "BUYER_FREE",
    role: "buyer",
    name: "Buyer Free",
    price: 0,
    durationDays: 30,
    features: {
      [PLAN_FEATURES.CONTACT_OWNER_LIMIT]: 2,
      [PLAN_FEATURES.PROPERTY_COMPARISON]: false,
      [PLAN_FEATURES.LEAD_DASHBOARD]: false,
      [PLAN_FEATURES.AREA_INSIGHTS_LEVEL]: 0,
    },
  },
  {
    code: "BUYER_TIER_2",
    role: "buyer",
    name: "Buyer Plus",
    price: 999,
    durationDays: 30,
    features: {
      [PLAN_FEATURES.CONTACT_OWNER_LIMIT]: 10,
      [PLAN_FEATURES.PROPERTY_COMPARISON]: true,
      [PLAN_FEATURES.LEAD_DASHBOARD]: true,
      [PLAN_FEATURES.AREA_INSIGHTS_LEVEL]: 2,
    },
  },

  // ================= OWNER (SELLER) =================
  {
    code: "OWNER_SELL_TIER_1",
    role: "owner_sell",
    name: "Owner Access",
    price: 499,
    durationDays: 30,
    features: {
      [PLAN_FEATURES.CONTACT_BUYER_LIMIT]: 10,
      [PLAN_FEATURES.PROPERTY_VISIBILITY_PERCENT]: 50,
      [PLAN_FEATURES.TOP_LISTING_DAYS]: 5,
      [PLAN_FEATURES.LEAD_DASHBOARD]: false,
    },
  },
  {
    code: "OWNER_SELL_TIER_3",
    role: "owner_sell",
    name: "Owner Max",
    price: 1999,
    durationDays: 30,
    features: {
      [PLAN_FEATURES.CONTACT_BUYER_LIMIT]: 20,
      [PLAN_FEATURES.PROPERTY_VISIBILITY_PERCENT]: 100,
      [PLAN_FEATURES.TOP_LISTING_DAYS]: 20,
      [PLAN_FEATURES.LEAD_DASHBOARD]: true,
      [PLAN_FEATURES.CRM_ACCESS]: true,
    },
  },

  // ================= AGENT =================
  {
    code: "AGENT_PRO",
    role: "agent_sell",
    name: "Agent Pro",
    price: 2499,
    durationDays: 30,
    features: {
      [PLAN_FEATURES.PROPERTY_LISTING_LIMIT]: 40,
      [PLAN_FEATURES.BUYER_REACH_PERCENT]: 100,
      [PLAN_FEATURES.LEAD_DASHBOARD]: true,
      [PLAN_FEATURES.TEAM_MEMBERS]: 1,
      [PLAN_FEATURES.TOP_LISTING_DAYS]: 10,
    },
  },
];
