"use client";

import { createPaymentOrder, verifyPayment } from "@/app/(pages)/builder/data";
import { Plan } from "@/types";

/* -------------------- CONFIG -------------------- */

const TIER_ORDER = ["free", "tier1", "tier2", "tier3"] as const;

const TIER_LABELS: Record<string, string> = {
  free: "FREE (Basic)",
  tier1: "TIER 1",
  tier2: "TIER 2",
  tier3: "TIER 3",
};

/* -------------------- TYPES -------------------- */

type FeatureRow = {
  label: string;
  render: (plan: Plan) => string;
};

type Props = {
  plans: Plan[];
  features: FeatureRow[];
    userType: "buyer" | "builder" | "agent";
};

/* -------------------- HELPERS -------------------- */

function normalizePlans(plans: Plan[]) {
  return plans.reduce<Record<string, Plan>>((acc, plan) => {
    acc[plan.tier] = plan;
    return acc;
  }, {});
}

/* -------------------- COMPONENT -------------------- */

export default function PricingComparisonTable({
  plans,
  features,
  userType
}: Props) {
  const plansByTier = normalizePlans(plans);

  const visibleTiers = TIER_ORDER.filter(
    (tier) => plansByTier[tier]
  );

  const handleSubscribe = async (plan: Plan) => {
    const order = await createPaymentOrder({
      planId: plan._id,
      userType,
    });

    // Free plan
    if (order.free) {
      alert("Plan activated successfully 🎉");
      return;
    }

    if (!(window as any).Razorpay) {
      alert("Payment SDK not loaded");
      return;
    }

    const rzp = new (window as any).Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,

      name: "Propenu",
      description: "Subscription Payment",

      handler: async (response: any) => {
        await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        alert("Payment successful 🎉");
      },
       theme: {
    color: "#27AE60",
  },
    });

    rzp.open();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border text-sm">
        {/* ---------- HEADER ---------- */}
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Feature</th>

            {visibleTiers.map((tier) => (
              <th
                key={tier}
                className="border p-3 text-center font-semibold"
              >
                {TIER_LABELS[tier]}
              </th>
            ))}
          </tr>
        </thead>

        {/* ---------- BODY ---------- */}
        <tbody>
          {features.map((row) => (
            <tr key={row.label}>
              <td className="border p-3 font-medium">
                {row.label}
              </td>

              {visibleTiers.map((tier) => (
                <td
                  key={tier}
                  className="border p-3 text-center"
                >
                  {row.render(plansByTier[tier])}
                </td>
              ))}
            </tr>
          ))}

          {/* ---------- SUBSCRIBE ROW ---------- */}
          <tr className="bg-gray-50">
            <td className="border p-3 font-semibold">
              Action
            </td>

            {visibleTiers.map((tier) => {
              const plan = plansByTier[tier];

              return (
                <td
                  key={tier}
                  className="border p-3 text-center"
                >
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className="btn-primary cursor-pointer text-white px-4 py-2 rounded text-sm"
                  >
                    {plan.price === 0 ? "Activate" : "Subscribe"}
                  </button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
