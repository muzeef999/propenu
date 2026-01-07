import { Plan } from "@/types";

export const buyerFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `₹${plan.price}/month`,
  },

  {
    label: "Property Category Access",
    render: (plan: Plan) =>
      plan.category === "rent" ? "Rent" : plan.category,
  },

  {
    label: "Owner Contact Limit",
    render: (plan: Plan) =>
      plan.features?.CONTACT_OWNER_LIMIT
        ? `Up to ${plan.features.CONTACT_OWNER_LIMIT} owners`
        : "—",
  },

  {
    label: "Property Comparison",
    render: (plan: Plan) =>
      plan.features?.PROPERTY_COMPARISON ? "✓" : "—",
  },

  {
    label: "Lead Management Dashboard",
    render: (plan: Plan) =>
      plan.features?.LEAD_DASHBOARD ? "✓" : "—",
  },
];
