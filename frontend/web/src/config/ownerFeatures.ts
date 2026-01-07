import { Plan } from "@/types";

export const ownerSellerFeatures = [
  {
    label: "Price",
    render: (plan: Plan) => `₹${plan.price}/month`,
  },

  {
    label: "Property Category Access",
    render: (plan: Plan) => plan.category,
  },

  {
    label: "Property Listing Limit",
    render: (plan: Plan) =>
      plan.features?.PROPERTY_LISTING_LIMIT
        ? `Up to ${plan.features.PROPERTY_LISTING_LIMIT} properties`
        : "Unlimited",
  },

  {
    label: "Buyer Enquiry Limit",
    render: (plan: Plan) =>
      plan.features?.ENQUIRY_LIMIT
        ? `Up to ${plan.features.ENQUIRY_LIMIT} enquiries`
        : "—",
  },

  {
    label: "Top Listing Visibility",
    render: (plan: Plan) =>
      plan.features?.TOP_LISTING_DAYS
        ? `${plan.features.TOP_LISTING_DAYS} days`
        : "—",
  },
];
