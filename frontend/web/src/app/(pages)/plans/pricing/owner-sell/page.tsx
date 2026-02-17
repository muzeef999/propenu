"use client";
import { ownerSellerFeatures } from "@/config/ownerFeatures";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";

const page = () => {
  const { data: owner_seller = [] } = useQuery({
    queryKey: ["owner_seller"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "sell",
      }),
  });

  return (
    <div>
      <h1 className="text-center font-medium text-2xl p-6">owner seller</h1>
      <PricingComparisonTable
        plans={owner_seller}
        features={ownerSellerFeatures}
        userType="buyer"
      />
    </div>
  );
};

export default page;
