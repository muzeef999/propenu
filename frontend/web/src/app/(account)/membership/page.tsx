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
  const { data: my_subscription, isLoading } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: useMySubscription,
  });

  if (isLoading) return <MembershipPageSkeleton />;

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

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-sm bg-green-100 ${className}`} />
  );
}

function MembershipPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <SkeletonBlock className="h-8 w-48 md:h-9" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
        <SkeletonBlock className="mt-2 h-4 w-4/5 max-w-lg" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="relative rounded-md border border-green-100 bg-white p-5 shadow-sm"
          >
            <div className="absolute right-4 top-2">
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>

            <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-center">
              <div className="flex">
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-14 w-14 rounded-lg" />
                    <div>
                      <SkeletonBlock className="h-4 w-36" />
                      <SkeletonBlock className="mt-2 h-3 w-28" />
                    </div>
                  </div>

                  <SkeletonBlock className="mt-3 h-3 w-40" />
                  <SkeletonBlock className="mt-4 h-10 w-full min-w-44 rounded-md" />
                </div>
              </div>

              <div className="relative flex flex-1 items-center rounded-md bg-[#f4fbf6] p-4">
                <div className="flex w-full flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="mb-2 flex justify-between gap-4">
                        <SkeletonBlock className="h-3 w-32" />
                        <SkeletonBlock className="h-3 w-20" />
                      </div>
                      <SkeletonBlock className="h-1.5 w-full rounded-full" />
                      {itemIndex > 0 && (
                        <SkeletonBlock className="mt-2 h-3 w-36" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Page;
