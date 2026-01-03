"use client";

import { useQuery } from "@tanstack/react-query";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { getPlans } from "@/data/ClientData";
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";

export default function BuyerRentalPlansPage() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["buyer-rent-plans"],
    queryFn: () =>
      getPlans({
        userType: "buyer",
        category: "rent",
      }),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="p-6 container">
      <h1 className="text-2xl font-bold mb-4">
        Buyer Rental Plans
      </h1>

      <PricingComparisonTable
        plans={plans}
        features={rentalBuyerFeatures}
        userType="builder"
      />
    </div>
  );
}
