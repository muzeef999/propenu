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
    <div className="max-w-4xl">
     
     <ActivePlanCard my_subscription={my_subscrpition} />
      
    </div>
  );
}
