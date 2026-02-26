"use client";

import React, { Suspense } from "react";
import FilterBar from "./FilterBar";
import { useAppSelector } from "@/Redux/store";
import { Property } from "@/types/property";
import { IResidential } from "@/types/residential";
import { ICommercial } from "@/types/commercial";
import { ILand } from "@/types/land";
import { IAgricultural } from "@/types/agricultural";
import { useStreamProperties } from "@/hooks/useStreamProperties";
import ResidentialCard from "./cards/ResidentialCard";
import CommercialCard from "./cards/CommercialCard";
import { LandCard } from "./cards/LandCard";
import AgriculturalCard from "./cards/AgriculturalCard";
import ad from "@/asserts/ad.png";
import Image from "next/image";
import { buildSearchParams } from "./filters/buildSearchParams";
import { selectCityWithLocalities } from "@/Redux/slice/citySlice";

const Page: React.FC = () => {
  
  const filters = useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);
  const params = React.useMemo(() => buildSearchParams(filters), [filters]);

  const { items, loading, total } = useStreamProperties(params);

  const renderPropertyCard = (type: string, p: Property) => {
    switch (type.toLowerCase()) {
      case "residential":
        return <ResidentialCard key={p.id} p={p as unknown as IResidential} />;
      case "commercial":
        return <CommercialCard key={p.id} p={p as unknown as ICommercial} />;
      case "land":
        return <LandCard key={p.id} p={p as unknown as ILand} />;
      case "agricultural":
        return <AgriculturalCard key={p.id} p={p as unknown as IAgricultural} />;
      default:
        return <div>No card found for this category.</div>;
    }
  };
  const locality = (() => {
    switch (filters.category) {
      case "Residential":
        return filters.residential.locality?.join(", ");
      case "Commercial":
        return filters.commercial.locality?.join(", ");
      case "Land":
        return filters.land.locality;
      case "Agricultural":
        return filters.agricultural.locality;
      default:
        return undefined;
    }
  })();

  const locationLabel = [locality, cityData?.city, cityData?.state]
    .filter(Boolean)
    .join(", ");


  return (
  <div className="relative min-h-screen"> 
    <Suspense fallback={<div className="sticky top-0 z-10 h-14 w-full bg-[#D1EFDD] shadow-sm" />}>
      <FilterBar />
    </Suspense>
    
    <div className="container p-4">
      {loading && <p>Loading properties…</p>}
      {!loading && (
        <p className="mb-4 pt-2 text-gray-700 capitalize text-base sm:text-lg md:text-xl lg:text-2xl leading-snug wrap-break-word">
          <strong>{total ?? items.length}</strong> Properties for {params.listingType} in 
          {locationLabel ? ` ${locationLabel}` : " your area"}
        </p>
      )}

      <div className="flex flex-col lg:flex-row w-full gap-4">
        <div className="w-full lg:w-[80%]">
          {items.map((p) => renderPropertyCard(filters.category, p))}
        </div>

        <div className="w-full lg:w-[20%]">
          <div className="sticky top-24"> {/* Optional: Make the Ad sticky too! */}
            <Image
              src={ad}
              alt="advertisement banner"
              className="w-full h-auto p-2"
            />
          </div>
        </div>
      </div>

      {!loading && items.length === 0 && <p>No properties found.</p>}
    </div>
  </div>
);
};

export default Page;
