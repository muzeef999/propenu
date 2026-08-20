"use client";
import React from 'react'
import { getPlans } from '@/data/ClientData';
import PricingComparisonTable from '@/ui/PricingComparisonTable';
import { useQuery } from '@tanstack/react-query';
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";
import { AiOutlineThunderbolt } from 'react-icons/ai';


export const BuyView = () => {
  const { data: buyPlans = [], isLoading } = useQuery({
    queryKey: ["buy"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "buy",
      }),
  });

  const buy = buyPlans.filter((plan: any) => plan?.tier !== "free");

  if (isLoading) return null;

  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        {/* Top Badge */}
        <div className="flex items-center gap-2 px-6 py-2 mb-6 rounded-md bg-[#F1FCF5] text-[#27AE60]">
          <AiOutlineThunderbolt size={18} fill="currentColor" />
          <span className="text-lg font-medium">
            Upgrade today and stay ahead of other buyers
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl font-medium leading-relaxed text-center text-gray-900">
          Get quick access to more owner contacts and properties faster.
        </h1>
      </div>

      <PricingComparisonTable
        plans={buy}
        features={rentalBuyerFeatures}
        userType="owner"
      />
    </>
  );
};
export default BuyView;
