"use client";

import ActivePlanCard from "@/app/(pages)/agent/ActivePlanCard";
import { useMySubscription } from "@/app/(pages)/agent/data";
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";

/* ---------------- Rent View ---------------- */
export const RentView = () => {
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

/* ---------------- Buy View ---------------- */
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

const Page = () => {
  const { data: my_subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: useMySubscription,
  });

  return (
    <div>
      <ActivePlanCard my_subscription={my_subscription} />
    
    </div>
  );
};

export default Page;
