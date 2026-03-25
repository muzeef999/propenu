"use client";

import { useQuery } from "@tanstack/react-query";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { getPlans, useMySubscription } from "../data";
import { agentFeatures } from "@/config/agentFeatureConfig";
import ActivePlanCard from "../ActivePlanCard";

export default function BuilderPlansPage() {
  const { data:plans, isLoading } = useQuery({
    queryKey: ["agent-plan-table"],
    queryFn: () =>
      getPlans({
        userType: "agent",
      }),
  });

  const { data: my_subscrpition } = useQuery({
    queryKey:["my-subscrpition"],
    queryFn: useMySubscription
  });


  if (isLoading) return <p>Loading...</p>;
    if (!plans) return <p>No plans</p>;


  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          My Plan
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Review your active subscription and keep track of the benefits
          available on your current plan.
        </p>
      </div>

      <ActivePlanCard my_subscription={my_subscrpition} />
    </div>
  );
}
