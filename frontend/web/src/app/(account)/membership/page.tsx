"use client";

import ActivePlanCard from "@/app/(pages)/agent/ActivePlanCard";
import { useMySubscription } from "@/app/(pages)/agent/data";
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


    const { data: my_subscrpition } = useQuery({
    queryKey:["my-subscrpition"],
    queryFn: useMySubscription
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

     <ActivePlanCard my_subscription={my_subscrpition} />


      <h1>owner seller</h1>
      <PricingComparisonTable
        plans={owner_seller}
        features={ownerSellerFeatures}
        userType="buyer"
      />

      <h1>owner rental</h1>
      <PricingComparisonTable
        plans={owner_rental}
        features={ownerSellerFeatures}
        userType="buyer"
      />
    </div>
  );
};

export default page;
