export const plans = [
// ---------------- RENTAL subscription ----------------
{
    code: "RENTAL_FREE",
    userType: "rental",
    category: "rent",
    tier: "free",
    name: "Free",
    price: 0,
    features: {
      CONTACT_OWNER_LIMIT: 2,
    },
  },

  {
    code: "RENTAL_TIER_1",
    userType: "rental",
    category: "rent",
    tier: "tier1",
    name: "Rental Assist",
    price: 699,
    features: {
      CONTACT_OWNER_LIMIT: 4,
    },
  },
  {
    code: "RENTAL_TIER_2",
    userType: "rental",
    category: "rent",
    tier: "tier2",
    name: "Rental Guide",
    price: 1499,
    features: {
      CONTACT_OWNER_LIMIT: 10,
      PROPERTY_COMPARISON: true,
      LEAD_DASHBOARD: true,
    },
  },
  {
    code: "RENTAL_TIER_3",
    userType: "rental",
    category: "rent",
    tier: "tier3",
    name: "Rental Assure",
    price: 2999,
    features: {
      CONTACT_OWNER_LIMIT: 20,
      PROPERTY_COMPARISON: true,
      LEAD_DASHBOARD: true,
    },
  },

  // ---------------- BUYER subscription ----------------
  {
    code: "BUYER_FREE",
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
  {
    code: "BUYER_RENT_TIER_3",
    userType: "buyer",
    category: "rent",
    tier: "tier3",
    name: "Buyer Advance",
    price: 1999,
    features: {
      CONTACT_OWNER_LIMIT: 20,
      PROPERTY_COMPARISON: true,
      LEAD_DASHBOARD: true,
    },
  },

  // ---------------- OWNER SELL ----------------
  {
    code: "OWNER_SELL_TIER_0",
    userType: "owner",
    category: "sell",
    tier: "tier0",
    name: "Free",
    price: 0,
    features: {
      PROPERTY_LISTING_LIMIT: 2,
      ENQUIRY_LIMIT: 2,
      TOP_LISTING_DAYS: 0,
    },
  },

  {
    code: "OWNER_SELL_TIER_1",
    userType: "owner",
    category: "sell",
    tier: "tier1",
    name: "Owner Access",
    price: 499,
    features: {
       PROPERTY_LISTING_LIMIT: 10,
      ENQUIRY_LIMIT: 10,
      TOP_LISTING_DAYS: 5,
    },
  },
  {
    code: "OWNER_SELL_TIER_2",
    userType: "owner",
    category: "sell",
    tier: "tier2",
    name: "Owner Advantage",
    price: 499,
    features: {
       PROPERTY_LISTING_LIMIT: 15,
      ENQUIRY_LIMIT: 15,
      TOP_LISTING_DAYS: 10,
    },
  },

  {
    code: "OWNER_SELL_TIER_3",
    userType: "owner",
    category: "sell",
    tier: "tier3",
    name: "Owner Ultra",
    price: 1999,
    features: {
       PROPERTY_LISTING_LIMIT: 20,
      ENQUIRY_LIMIT: 20,
      TOP_LISTING_DAYS: 5,
    },
  },


  // ---------------- OWNER RENT ----------------
  {
    code: "OWNER_RENT_TIER_0",
    userType: "owner",
    category: "rent",
    tier: "tier0",
    name: "Free",
    price: 0,
    features: {
       PROPERTY_LISTING_LIMIT: 2,
      ENQUIRY_LIMIT: 2,
      TOP_LISTING_DAYS: 0,
    },
  },
  {
    code: "OWNER_RENT_TIER_1",
    userType: "owner",
    category: "rent",
    tier: "tier1",
    name: "Owner Access",
    price: 499,
    features: {
       PROPERTY_LISTING_LIMIT: 10,
      ENQUIRY_LIMIT: 10,
      TOP_LISTING_DAYS: 5,
    },
  },
  {
    code: "OWNER_RENT_TIER_2",
    userType: "owner",
    category: "rent",
    tier: "tier2",
    name: "Owner Access",
    price: 499,
    features: {
       PROPERTY_LISTING_LIMIT: 15,
      ENQUIRY_LIMIT: 15,
      TOP_LISTING_DAYS: 10,
    },
  },
  {
    code: "OWNER_RENT_TIER_3",
    userType: "owner",
    category: "rent",
    tier: "tier1",
    name: "Owner Access",
    price: 499,
    features: {
       PROPERTY_LISTING_LIMIT: 20,
      ENQUIRY_LIMIT: 20,
      TOP_LISTING_DAYS: 20,
    },
  },


  // ---------------- AGENT BOTH ----------------
  {
  code: "AGENT_RENT_STARTER",
  userType: "agent",
  category: "rent",
  tier: "tier1",
  name: "Starter Rent",
  price: 999,
  features: {
    PROPERTY_LISTING_LIMIT: 20,
    BUYER_REACH_PERCENT: 50,
    BUYER_ACCESS: false,
    LEAD_DASHBOARD: false,
  },
},

{
  code: "AGENT_RENT_PRO",
  userType: "agent",
  category: "rent",
  tier: "tier2",
  name: "Pro Rent",
  price: 1999,
  features: {
    PROPERTY_LISTING_LIMIT: 40,
    BUYER_REACH_PERCENT: 100,
    BUYER_ACCESS: true,
    LEAD_DASHBOARD: true,
  },
},
  
  // ---------------- AGENT SELL ----------------

  {
  code: "AGENT_SELL_STARTER",
  userType: "agent",
  category: "sell",
  tier: "tier1",
  name: "Starter Sell",
  price: 2499,
  features: {
    PROPERTY_LISTING_LIMIT: 20,
    BUYER_REACH_PERCENT: 50,
    BUYER_ACCESS: false,
    LEAD_DASHBOARD: false,
  },
},

{
  code: "AGENT_SELL_PRO",
  userType: "agent",
  category: "sell",
  tier: "tier2",
  name: "Pro Sell",
  price: 3499,
  features: {
    PROPERTY_LISTING_LIMIT: 40,
    BUYER_REACH_PERCENT: 100,
    BUYER_ACCESS: true,
    LEAD_DASHBOARD: true,
  },
},
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

