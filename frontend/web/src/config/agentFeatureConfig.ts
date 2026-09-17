import { Plan } from "@/types";

export const agentFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `Rs.${plan.price}/month`,
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
    render: (plan: Plan) => {
      const limit =
        plan.features?.PROPERTY_LISTING_LIMIT ??
        (plan.features as any)?.propertyListingLimit;
      return limit ? `Up to ${limit} listings` : "-";
    },
  },

  {
    label: "Buyer Reach (Property Reaching Buyers)",
    render: (plan: Plan) => {
      const v = plan.features?.BUYER_REACH_PERCENT;
      if (!v) return "Limited";
      return v === 100 ? "Unlimited (100% Buyers)" : `${v}% Buyers`;
    },
  },

  {
    label: "Contact Limits",
    render: (plan: Plan) => {
      const limit =
        plan.features?.CONTACT_LIMIT ??
        plan.features?.CONTACT_OWNER_LIMIT ??
        (plan.features as any)?.contactLimit;
      return limit ? `Up to ${limit} contacts` : "-";
    },
  },

  {
    label: "Buyer Access",
    render: (plan: Plan) => (plan.features?.BUYER_ACCESS ? "Yes" : "-"),
  },

  {
    label: "Lead Management Dashboard",
    render: (plan: Plan) => (plan.features?.LEAD_DASHBOARD ? "Yes" : "-"),
  },

  {
    label: "Agent Account Access",
    render: (plan: Plan) => {
      const members = plan.features?.TEAM_MEMBERS;
      return members ? `Add up to ${members} team members` : "-";
    },
  },
];
