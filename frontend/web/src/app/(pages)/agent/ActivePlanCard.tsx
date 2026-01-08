"use client";

import {
  MdCheckCircle,
  MdOutlineHomeWork,
  MdOutlineWorkspacePremium,
  MdOutlineAccessTime,
} from "react-icons/md";
import PromoBanner from "@/components/PromoBanner";

/* ================= TYPES ================= */

type Plan = {
  userType: string;
  category: string | null;
  code: string;
  tier: string;
  price: number;
  startDate: string;
  endDate: string;
  features: {
    PROPERTY_LISTING_LIMIT?: number;
    ENQUIRY_LIMIT?: number;
    TOP_LISTING_DAYS?: number;
    CONTACT_OWNER_LIMIT?: number;
    BUYER_REACH_PERCENT?: number;
    BUYER_ACCESS?: boolean;
    LEAD_DASHBOARD?: boolean;
  };
};

type ActivePlanCardProps = {
 my_subscription: {
    active: boolean;
    plans: {
      userType: string;
      category: string | null;
      code: string;
      tier: string;
      price: number;
      startDate: string;
      endDate: string;
      features: {
        PROPERTY_LISTING_LIMIT?: number;
        ENQUIRY_LIMIT?: number;
        TOP_LISTING_DAYS?: number;
        CONTACT_OWNER_LIMIT?: number;
        BUYER_REACH_PERCENT?: number;
        BUYER_ACCESS?: boolean;
        LEAD_DASHBOARD?: boolean;
      };
    }[];
  } | undefined;
};
/* ================= COMPONENT ================= */

const ActivePlanCard = ({ my_subscription }: ActivePlanCardProps) => {
  /* ❌ No active subscription */
  if (!my_subscription?.active || !my_subscription.plans?.length) {
    return <PromoBanner />;
  }

  /* ========== RENDER SINGLE PLAN CARD ========== */
  const renderPlanCard = (plan: Plan) => {
    /* Dates */
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);

    /* PLAN DURATION PROGRESS */
    const totalDays = Math.max(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      1
    );
    const elapsedDays = Math.max(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      0
    );
    const planProgress = Math.min((elapsedDays / totalDays) * 100, 100);
    const remainingDays = Math.max(
      Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      0
    );

    /* PROPERTY LISTING PROGRESS */
    const propertyLimit = plan.features.PROPERTY_LISTING_LIMIT ?? 0;
    const propertyUsed = 0; // 🔹 replace later
    const propertyProgress = propertyLimit
      ? Math.min((propertyUsed / propertyLimit) * 100, 100)
      : 0;

    /* ACTIVE FEATURES */
    const activeFeatures = [
      plan.features.PROPERTY_LISTING_LIMIT && {
        label: "Listings",
        value: plan.features.PROPERTY_LISTING_LIMIT,
      },
      plan.features.ENQUIRY_LIMIT && {
        label: "Enquiries",
        value: plan.features.ENQUIRY_LIMIT,
      },
      plan.features.TOP_LISTING_DAYS && {
        label: "Top Listing Days",
        value: `${plan.features.TOP_LISTING_DAYS} days`,
      },
      plan.features.BUYER_ACCESS && {
        label: "Buyer Access",
        value: "Enabled",
      },
      plan.features.LEAD_DASHBOARD && {
        label: "Lead Dashboard",
        value: "Enabled",
      },
    ].filter(Boolean) as { label: string; value: string | number }[];
    console.log("active plan", plan)

    return (
      <div
        key={plan.code}
        className="w-full rounded-2xl bg-[#e8f5e9] p-8 shadow-sm"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT — PLAN INFO */}
          <div className="flex items-start gap-4 lg:w-1/4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c8e6c9] text-[#27AE60]">
              <MdOutlineWorkspacePremium size={22} />
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                {plan.code.replaceAll("_", " ")}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {plan.userType}
                {plan.category ? ` • ${plan.category}` : ""} •{" "}
                <span className="font-medium">{plan.tier}</span>
              </p>
              <p className="mt-1 text-lg font-semibold">
                ₹{plan.price}
                <span className="text-sm text-gray-500"> / month</span>
              </p>
            </div>
          </div>

          {/* MIDDLE — PROGRESS & FEATURES */}
          <div className="flex flex-col gap-5 lg:w-2/4">
            {/* PLAN PROGRESS */}
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MdOutlineAccessTime className="text-[#27AE60]" />
                  Plan Duration
                </span>
                <span>{remainingDays} days left</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-[#27AE60]"
                  style={{ width: `${planProgress}%` }}
                />
              </div>
            </div>

            {/* PROPERTY LISTING PROGRESS */}
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MdOutlineHomeWork />
                  Property Listings
                </span>
                <span>
                  {propertyUsed}/{propertyLimit}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-[#2ecc71]"
                  style={{ width: `${propertyProgress}%` }}
                />
              </div>
            </div>

            {/* FEATURES */}
            <ul className="flex flex-wrap gap-2">
              {activeFeatures.map((f, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs"
                >
                  <MdCheckCircle className="text-[#27AE60]" />
                  <span className="font-medium">{f.label}</span>
                  <span className="text-gray-600">{f.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — STATUS & CTA */}
          <div className="flex flex-col items-start gap-3 lg:w-1/4 lg:items-end">
            <span className="rounded-full bg-[#c8e6c9] px-3 py-1 text-xs font-semibold text-[#27AE60]">
              Active
            </span>

            <p className="text-xs text-gray-600">
              Renews on{" "}
              {endDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("pricing-table")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ========== FINAL RETURN ========== */
  return (
    <div className="space-y-6">
      {my_subscription.plans.map((plan) => renderPlanCard(plan))}
    </div>
  );
};

export default ActivePlanCard;
