"use client";

import { getOwnerProperties } from "@/data/ClientData";
import { PopularOwnerProperty } from "@/types";
import { minDelay } from "@/utilies/minDelay";
import { useQuery } from "@tanstack/react-query";
import ResidentialCard from "../properties/cards/ResidentialCard";
import CommercialCard from "../properties/cards/CommercialCard";
import AgriculturalCard from "../properties/cards/AgriculturalCard";
import { LandCard } from "../properties/cards/LandCard";
import { HiOutlineBolt } from "react-icons/hi2";
import { useEffect, useState } from "react";

const propertySkeletonItems = Array.from({ length: 4 });

function PropertiesListSkeleton() {
  return (
    <div className="space-y-4">
      {propertySkeletonItems.map((_, index) => (
        <div
          key={`property-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:h-[236px] md:flex-row">
            <div className="h-48 w-full animate-pulse rounded-xl bg-gray-200 md:h-full md:w-56 md:shrink-0" />

            <div className="flex min-w-0 flex-1 flex-col justify-between p-2 md:p-4">
              <div>
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4 md:gap-6">
                {Array.from({ length: 4 }).map((__, metaIndex) => (
                  <div key={`property-skeleton-meta-${metaIndex}`} className="space-y-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#27AE60]/10 px-3 py-4 md:flex md:w-52 md:flex-col md:justify-center">
              <div className="h-7 w-24 animate-pulse rounded bg-[#27AE60]/20" />
              <div className="mt-2 h-4 w-16 animate-pulse rounded bg-[#27AE60]/15" />
              <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-[#27AE60]/25" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const renderPropertyCard = (item: PopularOwnerProperty) => {
  const p = { ...(item as any), id: (item as any)._id };

  switch (p.type) {
    case "residential":
      return <ResidentialCard p={p} />;
    case "commercial":
      return <CommercialCard p={p} />;
    case "land":
      return <LandCard p={p} />;
    case "agricultural":
      return <AgriculturalCard p={p} />;
    default:
      return null;
  }
};

const Page = () => {
  const { data, isLoading, isError } = useQuery<{ items: PopularOwnerProperty[] }>(
    {
      queryKey: ["owner-properties"],
      queryFn: async () => {
        const [response] = await Promise.all([
          getOwnerProperties({}),
          minDelay(1500),
        ]);

        return response;
      },
    }
  );

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 15000); // 15 seconds

    return () => clearTimeout(timer);
  }, []);

  /* -------------------- Loading -------------------- */
  if (isLoading) {
    return (
      <>
        {visible && (
          <div className="w-full bg-[#4F8EF7] text-white text-sm">
            <div className="relative container mx-auto px-4 py-2 flex items-center">
              <p className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-center">
                <HiOutlineBolt className="text-base" />
                <span>
                  Each listing offers a simpler way to connect with owners and move
                  faster in your home search.
                </span>
              </p>

              <button
                onClick={() => setVisible(false)}
                className="ml-auto text-white/80 hover:text-white text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="container p-4 sm:p-6">
          <div className="w-full lg:w-[80%]">
            <PropertiesListSkeleton />
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load owner properties
      </div>
    );
  }

  const properties = data?.items ?? [];

  if (properties.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No properties found
      </div>
    );
  }

  return (
    <>
      {/* ✅ Banner ONLY */}
      {visible && (
        <div className="w-full bg-[#4F8EF7] text-white text-sm">
          <div className="relative container mx-auto px-4 py-2 flex items-center">
            <p className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-center">
              <HiOutlineBolt className="text-base" />
              <span>
                Each listing offers a simpler way to connect with owners and move
                faster in your home search.
              </span>
            </p>

            <button
              onClick={() => setVisible(false)}
              className="ml-auto text-white/80 hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ✅ Page content stays */}
      <div className="container p-4 sm:p-6">
        <div className="space-y-4 w-[80%]">
          {properties.map((item) => (
            <div key={item._id}>{renderPropertyCard(item)}</div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Page;
