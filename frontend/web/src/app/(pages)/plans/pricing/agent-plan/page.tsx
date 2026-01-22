"use client";

import { agentFeatures } from "@/config/agentFeatureConfig";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const AgentPlansPage = () => {
  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["agent-plan-table"],
    queryFn: () =>
      getPlans({
        userType: "agent",
      }),
  });

  if (isLoading) {
    return <div className="text-center p-6">Loading plans...</div>;
  }

  if (isError) {
    return (
      <div className="text-center p-6 text-red-500">
        Failed to load plans
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center font-medium text-2xl p-6">
        Agent Plans
      </h1>

      <PricingComparisonTable
        plans={plans}
        features={agentFeatures}
        userType="agent"
      />
    </div>
  );
};

export default AgentPlansPage;
