"use client";

import { agentFeatures } from "@/config/agentFeatureConfig";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { AiOutlineThunderbolt } from "react-icons/ai";

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
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        {/* Top Badge */}
        <div className="flex items-center gap-2 px-6 py-2 mb-6 rounded-md bg-[#F1FCF5] text-[#27AE60]">
          <AiOutlineThunderbolt size={18} fill="currentColor" />
          <span className="text-lg font-medium">
            Upgrade today and close more deals with confidence
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl font-medium leading-relaxed text-center text-gray-900">
          Scale your real estate business with our flexible pricing. Frome individual agent to agencies.
        </h1>
      </div>

      <PricingComparisonTable
        plans={plans}
        features={agentFeatures}
        userType="agent"
      />
    </div>
  );
};

export default AgentPlansPage;
