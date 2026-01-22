"use client";

import {
  MdCheckCircle,
  MdOutlineHomeWork,
  MdOutlineWorkspacePremium,
  MdOutlineAccessTime,
  MdOutlinePhoneInTalk,
} from "react-icons/md";
import PromoBanner from "@/components/PromoBanner";

type Plan = {
  userType: string;
  category: string;
  code: string;
  tier: string;
  planName: String;
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
      1,
    );

    const elapsedDays =
      now < startDate.getTime()
        ? 0
        : (now - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const planProgress = Math.min((elapsedDays / totalDays) * 100, 100);

    const remainingDays = Math.max(
      Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)),
      0,
    );

    const usageProgress =
      plan.total > 0 ? Math.min((plan.used / plan.total) * 100, 100) : 0;

    const isPropertyPlan = plan.unit === "properties";

    return (
      <div
        key={plan.code}
        className="w-full rounded-md border border-green-100 bg-white p-3 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* LEFT */}
          <div className="flex lg:w-[22%] gap-4 items-start">
            {/* ICON + PLAN NAME */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#f4fbf6] text-[#27AE60] shadow-md">
                  <MdOutlineWorkspacePremium size={34} />
                </div>

                {/* Plan Name beside icon */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {plan.planName}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {plan.userType} • {plan.category} {" "}
                    {/* <span className="font-medium">{plan.tier}</span> */}
                  </p>
                </div>
              </div>

              {/* Helper text */}
              <span className="text-[10px] text-gray-400 leading-tight pl-1 mt-4">
                Upgrade to unlock full features
              </span>
            </div>
          </div>



          {/* RIGHT — SINGLE HIGHLIGHTED PANEL */}
          <div className="flex flex-1 items-center rounded-md bg-[#f4fbf6] p-4">
            <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Progress */}
              <div className="flex w-full flex-col gap-3 lg:w-[60%]">
                {/* Plan duration */}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <MdOutlineAccessTime className="text-[#27AE60]" />
                      Plan duration
                    </span>
                    <span className="font-medium">
                      {remainingDays} days left
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-[#27AE60]"
                      style={{ width: `${planProgress}%` }}
                    />
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      {isPropertyPlan ? (
                        <MdOutlineHomeWork />
                      ) : (
                        <MdOutlinePhoneInTalk />
                      )}
                      {isPropertyPlan ? "Property listings" : "Owner contacts"}
                    </span>
                    <span className="font-medium">
                      {plan.used}/{plan.total}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-1.5 rounded-full ${usageProgress >= 100 ? "bg-red-500" : "bg-[#2ecc71]"
                        }`}
                      style={{ width: `${usageProgress}%` }}
                    />
                  </div>

                  <p className="mt-1 text-[11px] text-gray-500">
                    {plan.remaining} remaining {plan.unit}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="relative flex w-full flex-col items-end gap-2 lg:w-[32%]">

                <button className="w-full rounded-md border border-[#27AE60] px-3 py-2 text-sm font-medium text-[#27AE60] hover:bg-[#eaf7ef]">
                  Manage Membership
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("pricing-table")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="w-full rounded-md bg-[#27AE60] px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">{my_subscription.plans.map(renderPlanCard)}</div>
  );
};

export default ActivePlanCard;
