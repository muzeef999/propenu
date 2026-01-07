"use client";

import { agentFeatures } from "@/config/agentFeatureConfig";
import { buyerFeatures } from "@/config/ownerFeatures";
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

  const { data: owner_rental = [] } = useQuery({
    queryKey: ["owner_rental"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "rent",
      }),
  });

  return (
    <div>
      <h1>hello memebership</h1>

      <h1>owner seller</h1>
      <PricingComparisonTable
        plans={owner_seller}
        features={buyerFeatures}
        userType="buyer"
      />

      <h1>owner rental</h1>
      <PricingComparisonTable
        plans={owner_rental}
        features={buyerFeatures}
        userType="buyer"
      />
    </div>
  );
};

export default page;
