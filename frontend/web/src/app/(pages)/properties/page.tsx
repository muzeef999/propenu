"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { HiArrowsUpDown } from "react-icons/hi2";
import FilterBar from "./FilterBar";
import { useAppSelector } from "@/Redux/store";
import { selectCityWithLocalities } from "@/Redux/slice/citySlice";
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
import { buildSearchParams } from "./filters/buildSearchParams";

const Page: React.FC = () => {
  const filters = useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);
  const params = React.useMemo(() => buildSearchParams(filters), [filters]);
  const { items, loading, total } = useStreamProperties(params);
  const [sortBy, setSortBy] = React.useState("newest");

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

  const getAreaValue = (property: Property): number => {
    const candidate = [
      property.superBuiltUpArea,
      (property as any)?.builtUpArea,
      (property as any)?.plotArea,
      (property as any)?.totalArea?.value,
    ].find((v) => typeof v === "number" && Number.isFinite(v));
    return typeof candidate === "number" ? candidate : 0;
  };

  const sortedItems = React.useMemo(() => {
    const list = [...items];

    switch (sortBy) {
      case "price-low-high":
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "price-high-low":
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case "area-low-high":
        return list.sort((a, b) => getAreaValue(a) - getAreaValue(b));
      case "area-high-low":
        return list.sort((a, b) => getAreaValue(b) - getAreaValue(a));
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
      case "newest":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
    }
  }, [items, sortBy]);

  return (
    <div className="relative min-h-screen">
      <Suspense
        fallback={<div className="sticky top-0 z-10 h-14 w-full bg-[#D1EFDD] shadow-sm" />}
      >
        <FilterBar />
      </Suspense>

      <div className="container p-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[80%]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {loading && <p>Loading properties...</p>}
              {!loading && (
                <p className="text-base capitalize leading-snug text-gray-700 wrap-break-word sm:text-lg md:text-xl lg:text-2xl">
                  <strong>{total ?? items.length}</strong> Properties for {params.listingType} in
                  {locationLabel ? ` ${locationLabel}` : " your area"}
                </p>
              )}

              <label className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm cursor-pointer">
                <HiArrowsUpDown className="h-4 w-4" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                  aria-label="Sort properties"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="area-low-high">Area: Low to High</option>
                  <option value="area-high-low">Area: High to Low</option>
                </select>
              </label>
            </div>

            {sortedItems.map((p) => renderPropertyCard(filters.category, p))}
            {!loading && sortedItems.length === 0 && <p>No properties found.</p>}
          </div>

          <div className="w-full lg:w-[20%]">
            <div className="sticky top-24">
              <Image src={ad} alt="advertisement banner" className="h-auto w-full p-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
