"use client";
import { ownerSellerFeatures } from "@/config/ownerFeatures";
import { getPlans } from "@/data/ClientData";
import PricingComparisonTable from "@/ui/PricingComparisonTable";
import { useQuery } from "@tanstack/react-query";
import { AiOutlineThunderbolt } from "react-icons/ai";

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
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        {/* Top Badge */}
        <div className="flex items-center gap-2 px-6 py-2 mb-6 rounded-md bg-[#F1FCF5] text-[#27AE60]">
          <AiOutlineThunderbolt size={18} fill="currentColor" />
          <span className="text-lg font-medium">
            Upgrade today and get genune enquiries from verified buyers
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl font-medium leading-relaxed text-center text-gray-900">
          Sell faster with Propenu's smart seller plan. From one home to multiple properties.
        </h1>
      </div>

      <PricingComparisonTable
        plans={owner_seller}
        features={ownerSellerFeatures}
        userType="buyer"
      />
    </div>
  );
};

export default page;
