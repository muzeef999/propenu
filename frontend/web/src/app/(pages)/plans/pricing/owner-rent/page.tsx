"use client";
import { ownerSellerFeatures } from "@/config/ownerFeatures";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";

const page = () => {
 
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
      <h1 className="text-center font-medium text-2xl p-6">owner rental</h1>
      <PricingComparisonTable
        plans={owner_rental}
        features={ownerSellerFeatures}
        userType="buyer"
      />
    </div>
  );
};

export default page;
