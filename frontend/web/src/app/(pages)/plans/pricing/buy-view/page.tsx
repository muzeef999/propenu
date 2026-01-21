"use client";
import React from 'react'
import { getPlans } from '@/data/ClientData';
import PricingComparisonTable from '@/ui/PricingComparisonTable';
import { useQuery } from '@tanstack/react-query';
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";


export const BuyView = () => {
  const { data: buy = [], isLoading } = useQuery({
    queryKey: ["buy"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "buy",
      }),
  });

  if (isLoading) return null;

  return (
    <>
      <h1 className="text-center font-medium text-2xl p-6">
        Buy View
      </h1>

      <PricingComparisonTable
        plans={buy}
        features={rentalBuyerFeatures}
        userType="owner"
      />
    </>
  );
};
export default BuyView;