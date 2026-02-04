"use client";

import { getOwnerProperties } from "@/data/ClientData";
import { PopularOwnerProperty } from "@/types";
import { useQuery } from "@tanstack/react-query";
import ResidentialCard from "../properties/cards/ResidentialCard";
import CommercialCard from "../properties/cards/CommercialCard";
import AgriculturalCard from "../properties/cards/AgriculturalCard";
import { LandCard } from "../properties/cards/LandCard";
import { HiOutlineBolt } from "react-icons/hi2";
import { useEffect, useState } from "react";

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
      queryFn: () => getOwnerProperties({}),
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
      <div className="p-6 text-center text-gray-500">
        Loading owner properties...
      </div>
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
