export const plans = [
  // ---------------- BUYER RENT ----------------
  {
    code: "BUYER_RENT_FREE",
    userType: "buyer",
    category: "rent",
    tier: "free",
    name: "Buyer Free",
    price: 0,
    features: {
      CONTACT_OWNER_LIMIT: 2,
    },
  },
  {
    code: "BUYER_RENT_TIER_1",
    userType: "buyer",
    category: "rent",
    tier: "tier1",
    name: "Buyer Easy",
    price: 499,
    features: {
      CONTACT_OWNER_LIMIT: 4,
    },
  },
  {
    code: "BUYER_RENT_TIER_2",
    userType: "buyer",
    category: "rent",
    tier: "tier2",
    name: "Buyer Core",
    price: 999,
    features: {
      CONTACT_OWNER_LIMIT: 10,
      PROPERTY_COMPARISON: true,
      LEAD_DASHBOARD: true,
    },
  },

  // ---------------- OWNER SELL ----------------
  {
    code: "OWNER_SELL_TIER_1",
    userType: "owner",
    category: "sell",
    tier: "tier1",
    name: "Owner Access",
    price: 499,
    features: {
      ENQUIRY_LIMIT: 10,
      TOP_LISTING_DAYS: 5,
    },
  },

  // ---------------- AGENT BOTH ----------------
  {
    code: "AGENT_BOTH_ELITE",
    userType: "agent",
    category: "both",
    tier: "tier3",
    name: "Agent Elite",
    price: 4999,
    features: {
      PROPERTY_LISTING_LIMIT: 80,
      BUYER_REACH_PERCENT: 100,
      TEAM_MEMBERS: 5,
    },
  },
];
