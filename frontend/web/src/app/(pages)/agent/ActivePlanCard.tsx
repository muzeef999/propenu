"use client";

import {
  MdCheckCircle,
  MdOutlineHomeWork,
  MdOutlineWorkspacePremium,
  MdOutlineAccessTime,
  MdOutlinePhoneInTalk,
} from "react-icons/md";
import PromoBanner from "@/components/PromoBanner";

/* ================= TYPES ================= */

type Plan = {
  userType: string;
  category: string;
  code: string;
  tier: string;

  total: number;
  used: number;
  remaining: number;
  unit: "properties" | "contacts";

  startDate: string;
  endDate: string;
};

type ActivePlanCardProps = {
  my_subscription:
    | {
        active: boolean;
        plans: Plan[];
      }
    | undefined;
};

/* ================= COMPONENT ================= */

const ActivePlanCard = ({ my_subscription }: ActivePlanCardProps) => {
  if (!my_subscription?.active || !my_subscription.plans?.length) {
    return <PromoBanner />;
  }

  const renderPlanCard = (plan: Plan) => {
    /* ---------- DATE PROGRESS ---------- */

    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    const now = Date.now();

    const totalDays = Math.max(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      1
    );

    const elapsedDays =
      now < startDate.getTime()
        ? 0
        : (now - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const planProgress = Math.min((elapsedDays / totalDays) * 100, 100);

    const remainingDays = Math.max(
      Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)),
      0
    );

    /* ---------- USAGE PROGRESS ---------- */

    const usageProgress =
      plan.total > 0 ? Math.min((plan.used / plan.total) * 100, 100) : 0;

    const isPropertyPlan = plan.unit === "properties";

    /* ---------- UI ---------- */

    return (
      <div
        key={plan.code}
        className="w-full rounded-2xl bg-[#f4fbf6] p-7 shadow-sm border"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}
          <div className="flex items-start gap-4 lg:w-1/4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dff3e4] text-[#27AE60]">
              <MdOutlineWorkspacePremium size={22} />
            </div>

            <div>
              <h3 className="text-lg font-semibold">
                {plan.code.replaceAll("_", " ")}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {plan.userType} • {plan.category} •{" "}
                <span className="font-medium">{plan.tier}</span>
              </p>
            </div>
          </div>

          {/* MIDDLE */}
          <div className="flex flex-col gap-5 lg:w-2/4">
            {/* PLAN TIME */}
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MdOutlineAccessTime className="text-[#27AE60]" />
                  Plan duration
                </span>
                <span>{remainingDays} days left</span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-[#27AE60] transition-all"
                  style={{ width: `${planProgress}%` }}
                />
              </div>
            </div>

            {/* USAGE */}
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  {isPropertyPlan ? (
                    <MdOutlineHomeWork />
                  ) : (
                    <MdOutlinePhoneInTalk />
                  )}

                  {isPropertyPlan
                    ? "Property listings"
                    : "Owner contacts"}
                </span>

                <span>
                  {plan.used}/{plan.total}
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    usageProgress >= 100
                      ? "bg-red-500"
                      : "bg-[#2ecc71]"
                  }`}
                  style={{ width: `${usageProgress}%` }}
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {plan.remaining} remaining {plan.unit}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col items-start gap-3 lg:w-1/4 lg:items-end">
            <span className="rounded-full bg-[#dff3e4] px-3 py-1 text-xs font-semibold text-[#27AE60]">
              Active
            </span>

            <p className="text-xs text-gray-600">
              Expires on{" "}
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
              Upgrade plan
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {my_subscription.plans.map(renderPlanCard)}
    </div>
  );
};

export default ActivePlanCard;
