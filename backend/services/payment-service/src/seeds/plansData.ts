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



  // ---------------- BUILDER SELL ----------------
{
  code: "BUILDER_SELL_BASE",
  userType: "builder",
  category: "sell",
  tier: "tier1",
  name: "Builder Base",
  price: 2499,
  features: {
    TOP_LISTING_DAYS: 5,
    LEAD_DASHBOARD: true,
    NEW_LEADS: true,
    ACTIVE_LEADS: true,
  },
},
{
  code: "BUILDER_SELL_GROWTH",
  userType: "builder",
  category: "sell",
  tier: "tier2",
  name: "Builder Growth",
  price: 5999,
  features: {
    TOP_LISTING_DAYS: 10,
    LEAD_DASHBOARD: true,
    NEW_LEADS: true,
    ACTIVE_LEADS: true,
    FOLLOW_UPS: true,
    TEAM_MEMBERS: 1,
    PHOTOSHOOT: true,
  },
},
{
  code: "BUILDER_SELL_PRIME",
  userType: "builder",
  category: "sell",
  tier: "tier3",
  name: "Builder Prime",
  price: 11999,
  features: {
    TOP_LISTING_DAYS: 20,
    LEAD_DASHBOARD: true,
    NEW_LEADS: true,
    ACTIVE_LEADS: true,
    FOLLOW_UPS: true,
    CLOSED_DEALS: true,
    PROJECT_WISE_LEADS: true,
    TEAM_MEMBERS: 5,
    PHOTOSHOOT: true,
    WALKTHROUGH_3D: true,
    BANNER: true,
    BUYER_ACCESS: true,
  },
},

];

