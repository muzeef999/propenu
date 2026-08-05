"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import FeaturedPropertyCard from "./cards/FeaturedPropertyCard";
import AdCard, { type Ad } from "./cards/AdCard";
import SponsoreCard from "./cards/SponsoreCard";
import ad from "@/asserts/ad.png";
import { buildSearchParams } from "./filters/buildSearchParams";
import { injectSponsored } from "@/utilies/injectSponsored";
import FilterDropdown from "@/ui/FilterDropdown";
import { ArrowDropdownIcon } from "@/icons/icons";

const propertySkeletonItems = Array.from({ length: 4 });

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "area-low-high", label: "Area: Low to High" },
  { value: "area-high-low", label: "Area: High to Low" },
];


function getPropertyLink(property: any) {

  const type = (property.type || "").toLowerCase();
  const promotionType = String(property.promotion?.type || "").toLowerCase();

  switch (type) {
    case "residential":
      return `/properties/residential/${property.slug}`;
    case "commercial":
      return `/properties/commercial/${property.slug}`;
    case "land":
      return `/properties/landploat/${property.slug}`;
    case "agricultural":
      return `/properties/agricultural/${property.slug}`;
    case "featuredproject":
      return promotionType === "prime"
        ? `/prime/${property.slug}`
        : `/project/${property.slug}`;
    default:
      return "/";
  }
}

function isOwnerProperty(property: Property) {
  const type = (property.type || "").toLowerCase();
  const listingSource = String((property as any)?.listingSource || "user")
    .trim()
    .toLowerCase();

  return (
    type !== "featuredproject" &&
    listingSource !== "builder" &&
    listingSource !== "agent"
  );
}

function isAgentProperty(property: Property) {
  const type = (property.type || "").toLowerCase();
  const listingSource = String((property as any)?.listingSource || "")
    .trim()
    .toLowerCase();

  return type !== "featuredproject" && listingSource === "agent";
}


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
                  <div
                    key={`property-skeleton-meta-${metaIndex}`}
                    className="space-y-2"
                  >
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

const PropertiesPageContent: React.FC = () => {
  const filters = useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);
  const searchParams = useSearchParams();
  const urlCity = searchParams.get("city")?.trim() || undefined;
  const urlState = searchParams.get("state")?.trim() || undefined;
  const params = React.useMemo(
    () => ({
      ...buildSearchParams(filters),
      city: cityData?.city ?? urlCity,
      state: cityData?.state ?? urlState,
    }),
    [filters, cityData?.city, cityData?.state, urlCity, urlState],
  );
  const { items, sponsored, loading, total } = useStreamProperties(params);
  const [sortBy, setSortBy] = React.useState("newest");
  const [sortDropdownOpen, setSortDropdownOpen] = React.useState(false);
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());
  const listingSourceFilter = String((params as any).listingSource || "").toLowerCase();
  const isOwnerFilterActive =
    listingSourceFilter === "user";
  const isAgentFilterActive =
    listingSourceFilter === "agent";

  const selectedSortOption =
    sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0];

  const renderPropertyCard = (p: Property, index: number) => {
    const propertyForCard = {
      ...p,
      listingType: p.listingType || params.listingType,
    };
    const type = (propertyForCard.type || "").toLowerCase();
    const isSponsored = propertyForCard.promotion?.type === "sponsored";

    switch (type) {
      case "featuredproject":
        return <FeaturedPropertyCard key={p.id} p={propertyForCard} />;

      case "residential":
        return (
          <ResidentialCard
            key={p.id}
            p={propertyForCard as IResidential}
            isSponsored={isSponsored}
          />
        );

      case "commercial":
        return (
          <CommercialCard
            key={p.id}
            p={propertyForCard as unknown as ICommercial} // safe after type check
            isSponsored={isSponsored}
          />
        );
      case "land":
        return (
          <LandCard
            key={p.id}
            p={propertyForCard as ILand}
            isSponsored={isSponsored}
          />
        );

      case "agricultural":
        return (
          <AgriculturalCard
            key={p.id}
            p={propertyForCard as IAgricultural}
            isSponsored={isSponsored}
          />
        );

      default:
        return <div>No card found</div>;
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
      property.projectArea,
      (property as any)?.builtUpArea,
      (property as any)?.plotArea,
      (property as any)?.totalArea?.value,
    ].find((v) => typeof v === "number" && Number.isFinite(v));

    if (
      typeof property.builtUpArea === "object" &&
      typeof property.builtUpArea?.min === "number"
    ) {
      return property.builtUpArea.min;
    }

    return typeof candidate === "number" ? candidate : 0;
  };

  const sortedItems = React.useMemo(() => {
    const list = isOwnerFilterActive
      ? items.filter(isOwnerProperty)
      : isAgentFilterActive
        ? items.filter(isAgentProperty)
        : [...items];

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
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime(),
        );
      case "newest":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
    }
  }, [items, isOwnerFilterActive, isAgentFilterActive, sortBy]);

  const filteredSponsored = React.useMemo(() => {
    if (isOwnerFilterActive) return sponsored.filter(isOwnerProperty);
    if (isAgentFilterActive) return sponsored.filter(isAgentProperty);
    return sponsored;
  }, [sponsored, isOwnerFilterActive, isAgentFilterActive]);

  const finalList = React.useMemo(() => {
    return injectSponsored(sortedItems, filteredSponsored, 5);
  }, [sortedItems, filteredSponsored]);

  const sidebarAds = React.useMemo(() => {
    return filteredSponsored
      .slice(0, 2)
      .filter((ad) => !dismissedAds.has(ad.id || ad._id))
      .map((property) => ({
        id: property.id || property._id || "",
        title: property.title || "Featured Property",
        description: property.buildingName,
        imageUrl:
          property.gallery?.[0]?.url ||
          property.gallerySummary?.[0]?.url ||
          ad.src,
        ctaText: "View Details",
        ctaLink: getPropertyLink(property),
        category: property.type || "Featured",
        featured: property.promotion?.type === "featured",
        sponsored: true,
      } as Ad));
  }, [filteredSponsored, dismissedAds]);

  const handleDismissAd = (adId: string) => {
    setDismissedAds((prev) => new Set([...prev, adId]));
  };

  return (
    <div className="relative min-h-screen">
      <Suspense
        fallback={
          <div className="sticky top-0 z-10 h-14 w-full bg-[#D1EFDD] shadow-sm" />
        }
      >
        <FilterBar />
      </Suspense>

      <div className="container p-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[80%]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {loading && (
                <div className="h-8 w-64 animate-pulse rounded bg-gray-200 sm:w-80" />
              )}
              {!loading && (
                <p className="text-base capitalize leading-snug text-gray-700 wrap-break-word sm:text-lg md:text-xl lg:text-2xl">
                  <strong>{total ?? items.length}</strong> Properties for{" "}
                  {params.listingType} in
                  {locationLabel ? ` ${locationLabel}` : " your area"}
                </p>
              )}

              <FilterDropdown
                open={sortDropdownOpen}
                onOpenChange={setSortDropdownOpen}
                triggerLabel={
                  <button
                    type="button"
                    className="inline-flex min-w-[210px] items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
                    aria-label="Sort properties"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <HiArrowsUpDown className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selectedSortOption.label}</span>
                    </span>
                    <ArrowDropdownIcon
                      size={12}
                      color="#374151"
                      className={`shrink-0 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                }
                width="w-56"
                align="right"
                backdropClassName="fixed inset-0 z-40"
                renderContent={(close) => (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">
                      Sort Properties
                    </h4>
                    <div className="flex flex-col gap-1">
                      {sortOptions.map((option) => {
                        const selected = option.value === sortBy;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value);
                              close();
                            }}
                            className={`rounded px-2 py-1.5 text-left text-sm transition-colors cursor-pointer ${
                              selected
                                ? "bg-[#D1EFDD] font-semibold text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              />
            </div>

            {loading ? (
              <PropertiesListSkeleton />
            ) : (
              finalList.map((p, index) => renderPropertyCard(p, index))
            )}

            {!loading && sortedItems.length === 0 && (
              <p>No properties found.</p>
            )}
          </div>

          <div className="w-full lg:w-[20%]">

            <div className="sticky top-24">

              <div className="space-y-4">
                {sidebarAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} onDismiss={handleDismissAd} />
                ))}
                {sidebarAds.length === 0 && (
                  <SponsoreCard />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Page: React.FC = () => (
  <Suspense fallback={<PropertiesListSkeleton />}>
    <PropertiesPageContent />
  </Suspense>
);

export default Page;