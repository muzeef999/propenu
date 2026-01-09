"use client";

import ActivePlanCard from "@/app/(pages)/agent/ActivePlanCard";
import { useMySubscription } from "@/app/(pages)/agent/data";
import { ownerSellerFeatures } from "@/config/ownerFeatures";
import { rentalBuyerFeatures } from "@/config/rentalBuyerFeatures";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";

const page = () => {
  const { data: my_subscrpition } = useQuery({
    queryKey: ["my-subscrpition"],
    queryFn: useMySubscription,
  });

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

  const { data: rent = [] } = useQuery({
    queryKey: ["rent"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "rent_view",
      }),
  });

  const { data: buy = [] } = useQuery({
    queryKey: ["buy"],
    queryFn: () =>
      getPlans({
        userType: "owner",
        category: "buy",
      }),
  });


  return (
    <div>
      <ActivePlanCard my_subscription={my_subscrpition} />

      <h1 className="text-center font-medium text-2xl p-6">Rent view</h1>
      <PricingComparisonTable
        plans={rent}
        features={rentalBuyerFeatures}
        userType="owner"
      />

      <h1 className="text-center font-medium text-2xl p-6">Buy view</h1>

      <PricingComparisonTable
        plans={buy}
        features={rentalBuyerFeatures}
        userType="owner"
      />
      
      <h1 className="text-center font-medium text-2xl p-6">owner seller</h1>
      <PricingComparisonTable
        plans={owner_seller}
        features={ownerSellerFeatures}
        userType="buyer"
      />

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
