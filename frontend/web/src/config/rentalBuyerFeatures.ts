import { Plan } from "@/types";

export const rentalBuyerFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `₹${plan.price}/month`,
  },
  {
    label: "Owner Contact",
    render: (plan: Plan) =>
      plan.features?.CONTACT_OWNER_LIMIT
        ? `Up to ${plan.features.CONTACT_OWNER_LIMIT} Owners`
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
  {
    label: "Customer Relationship",
    render: (plan: Plan) =>
      plan.features?.CRM_ACCESS ? "✓" : "—",
  },
];
