import { Plan } from "@/types";

export const builderFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `₹${plan.price}/month`,
  },
  {
    label: "Top Listing Visibility",
    render: (plan: Plan) =>
      plan.features?.TOP_LISTING_DAYS
        ? `${plan.features.TOP_LISTING_DAYS} Days`
        : "—",
  },
  {
    label: "Lead Management Dashboard",
    render: (plan: Plan) =>
      plan.features?.LEAD_DASHBOARD ? "✓" : "—",
  },
  {
    label: "New Leads",
    render: (plan: Plan) =>
      plan.features?.NEW_LEADS ? "✓" : "—",
  },
  {
    label: "Active Leads",
    render: (plan: Plan) =>
      plan.features?.ACTIVE_LEADS ? "✓" : "—",
  },
  {
    label: "Follow-ups",
    render: (plan: Plan) =>
      plan.features?.FOLLOW_UPS ? "✓" : "—",
  },
  {
    label: "Closed Deals Tracking",
    render: (plan: Plan) =>
      plan.features?.CLOSED_DEALS ? "✓" : "—",
  },
  {
    label: "Project-wise Lead Distribution",
    render: (plan: Plan) =>
      plan.features?.PROJECT_WISE_LEADS ? "✓" : "—",
  },
  {
    label: "Team Members",
    render: (plan: Plan) =>
      plan.features?.TEAM_MEMBERS
        ? `Up to ${plan.features.TEAM_MEMBERS}`
        : "—",
  },
  {
    label: "Photoshoot",
    render: (plan: Plan) =>
      plan.features?.PHOTOSHOOT ? "✓" : "—",
  },
  {
    label: "3D Walkthrough",
    render: (plan: Plan) =>
      plan.features?.WALKTHROUGH_3D ? "✓" : "—",
  },
  {
    label: "Banner Promotion",
    render: (plan: Plan) =>
      plan.features?.BANNER ? "✓" : "—",
  },
];
