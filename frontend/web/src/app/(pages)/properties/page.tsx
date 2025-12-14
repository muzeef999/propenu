"use client";

import React from "react";
import FilterBar from "./FilterBar";
import { useAppSelector } from "@/Redux/store";
import { Property } from "@/types/property";
import { useStreamProperties } from "@/hooks/useStreamProperties";
import ResidentialCard from "./cards/ResidentialCard";
import CommercialCard from "./cards/CommercialCard";
import { LandCard } from "./cards/LandCard";
import AgriculturalCard from "./cards/AgriculturalCard";
import ad from "@/asserts/ad.png";
import Image from "next/image";

const Page: React.FC = () => {
  const { listingType, propertyType, searchText } = useAppSelector(
    (s) => s.filters
  );

  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/properties/search?propertyType=${propertyType}`;

  const { items, meta, loading } = useStreamProperties(url);

  const renderPropertyCard = (type: string, p: Property) => {
    switch (type.toLowerCase()) {
      case "residential":
        return <ResidentialCard key={p.id} p={p} />;
      case "commercial":
        return <CommercialCard key={p.id} p={p} />;
      case "land":
        return <LandCard key={p.id} p={p} />;
      case "agricultural":
        return <AgriculturalCard key={p.id} p={p} />;
      default:
        return <div>No card found for this category.</div>;
    }
  };

  return (
    <>
      <FilterBar />

      <div className="container p-4">
        {loading && <p>Loading properties…</p>}

        {/* Responsive Grid */}

        <div className="flex flex-col lg:flex-row w-full">
          <div className="w-full lg:w-[80%]">
            {items.map((p) => renderPropertyCard(propertyType, p))}
          </div>

          <div className="w-full lg:w-[20%]">
            <Image
              src={ad}
              alt="advertisement banner"
              className="w-full h-auto p-6"
            />
          </div>
        </div>

        {!loading && items.length === 0 && <p>No properties found.</p>}
      </div>
    </>
  );
};

export default Page;
