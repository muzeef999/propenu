"use client";

type ActivePlanCardProps = {
  my_subscription: {
    active: boolean;
    plan?: {
      code: string;
      tier: string;
      price: number;
      startDate: string;
      endDate: string;
      features: {
        PROPERTY_LISTING_LIMIT?: number;
        BUYER_REACH_PERCENT?: number;
        BUYER_ACCESS?: boolean;
        LEAD_DASHBOARD?: boolean;
      };
    };
  } | undefined;
};

const ActivePlanCard = ({ my_subscription }: ActivePlanCardProps) => {
  if (!my_subscription?.active || !my_subscription.plan) {
    return (
      <div className="w-full p-6 rounded-xl border bg-white">
        <h2 className="text-lg font-semibold">No Active Plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Subscribe to unlock premium features.
        </p>
      </div>
    );
  }

  const { plan } = my_subscription;

  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);

  const remainingDays = Math.max(
    Math.ceil(
      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
    0
  );

  return (
    <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Active Subscription
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your current plan details
          </p>
        </div>

        <div className="px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
          {remainingDays} days remaining
        </div>
      </div>

      <hr className="my-5" />

      {/* PLAN INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Plan</p>
          <p className="font-semibold">
            {plan.code.replaceAll("_", " ")}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Tier</p>
          <p className="font-semibold uppercase">
            {plan.tier}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="font-semibold">
            ₹{plan.price}/month
          </p>
        </div>
      </div>

      {/* DATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-500">Start Date</p>
          <p className="font-medium">
            {startDate.toDateString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">End Date</p>
          <p className="font-medium">
            {endDate.toDateString()}
          </p>
        </div>
      </div>

      <hr className="my-5" />

      {/* FEATURES */}
      <div>
        <h3 className="font-semibold mb-3">
          Plan Features
        </h3>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <li className="flex justify-between">
            <span>Property Listings</span>
            <span className="font-medium">
              {plan.features.PROPERTY_LISTING_LIMIT
                ? `Up to ${plan.features.PROPERTY_LISTING_LIMIT}`
                : "—"}
            </span>
          </li>

          <li className="flex justify-between">
            <span>Buyer Reach</span>
            <span className="font-medium">
              {plan.features.BUYER_REACH_PERCENT
                ? `${plan.features.BUYER_REACH_PERCENT}%`
                : "—"}
            </span>
          </li>

          <li className="flex justify-between">
            <span>Buyer Access</span>
            <span className="font-medium">
              {plan.features.BUYER_ACCESS ? "✓" : "—"}
            </span>
          </li>

          <li className="flex justify-between">
            <span>Lead Dashboard</span>
            <span className="font-medium">
              {plan.features.LEAD_DASHBOARD ? "✓" : "—"}
            </span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-end">
        <button className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
          Upgrade Plan
        </button>
      </div>
    </div>
  );
};

export default ActivePlanCard;
