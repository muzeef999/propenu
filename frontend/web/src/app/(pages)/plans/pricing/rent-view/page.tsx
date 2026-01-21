"use client";
import React from 'react'
import { getPlans } from '@/data/ClientData';
import PricingComparisonTable from '@/ui/PricingComparisonTable';
import { useQuery } from '@tanstack/react-query';
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";

const RentView = () => {
  const { data: rent = [], isLoading } = useQuery({
    queryKey: ["rent"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "rent_view",
      }),
  });

  if (isLoading) return null;

  return (
    <>
      <h1 className="text-center font-medium text-2xl p-6">
        Rent View
      </h1>

      <PricingComparisonTable
        plans={rent}
        features={rentalBuyerFeatures}
        userType="owner"
      />
    </>
  );
};

export default RentView;