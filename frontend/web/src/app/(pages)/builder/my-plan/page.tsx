"use client";

import { useQuery } from "@tanstack/react-query";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { getPlans } from "../data";
import { builderFeatures } from "@/config/builderFeatures";
import { shouldShowFreePlan } from "@/helpers/planHelpers";


export default function BuilderPlansPage() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans", "builder"],
    queryFn: () =>
      getPlans({
        userType: "builder",
      }),
  });

  if (isLoading) return <p>Loading...</p>;

const visiblePlans = shouldShowFreePlan("builder", "sell")
  ? plans
  : plans.filter((plan:any) => plan.tier !== "free");


  return (
    <div className="p-6 container">
      <h1 className="text-2xl font-bold mb-4">
        Builder Subscription Plans
      </h1>

      <PricingComparisonTable
        plans={visiblePlans}
        features={builderFeatures}
        userType="builder"
      />
    </div>
  );
}
