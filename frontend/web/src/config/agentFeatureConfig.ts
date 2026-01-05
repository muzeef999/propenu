import { Plan } from "@/types";

export const agentFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `₹${plan.price}/month`,
  },

  {
    label: "Property Category Access",
    render: (plan: Plan) =>
      plan.category === "both"
        ? "Sell + Rent"
        : plan.category === "rent"
        ? "Rent"
        : "Sell",
  },

  {
    label: "No. of Property Listings",
    render: (plan: Plan) =>
      plan.features?.PROPERTY_LISTING_LIMIT
        ? `Up to ${plan.features.PROPERTY_LISTING_LIMIT} listings`
        : "—",
  },

  {
    label: "Buyer Reach (Property Reaching Buyers)",
    render: (plan: Plan) => {
      const v = plan.features?.BUYER_REACH_PERCENT;
      if (!v) return "Limited";
      return v === 100
        ? "Unlimited (100% Buyers)"
        : `${v}% Buyers`;
    },
  },

  {
    label: "Buyer Access",
    render: (plan: Plan) =>
      plan.features?.BUYER_ACCESS ? "✓" : "—",
  },

  {
    label: "Lead Management Dashboard",
    render: (plan: Plan) =>
      plan.features?.LEAD_DASHBOARD ? "✓" : "—",
  },

  {
    label: "Agent Account Access",
    render: (plan: Plan) =>
      plan.features?.TEAM_MEMBERS
        ? `Add up to ${plan.features.TEAM_MEMBERS} team members`
        : "—",
  },
];
