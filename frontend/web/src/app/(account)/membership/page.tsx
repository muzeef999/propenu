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
      <div className="mb-6 rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Rent View Plans
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Compare available rent-view plans and choose the one that fits your
          property goals.
        </p>
      </div>

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
      <div className="mb-6 rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Buy View Plans
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Explore buy-view plans, compare features, and select the best option
          for your listings.
        </p>
      </div>

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
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Membership
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Check your active subscription and stay on top of your membership
          benefits.
        </p>
      </div>

      <ActivePlanCard my_subscription={my_subscription} />
    </div>
  );
};

export default Page;
