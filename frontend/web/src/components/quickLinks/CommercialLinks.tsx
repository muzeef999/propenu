"use client";

import React, { useState } from "react";
import { useCity } from "@/hooks/useCity";
import { ArrowDropdownIcon } from "@/icons/icons";
import ActiveTabs from "@/ui/ActiveTabs";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  setCategory,
  setCommercialFilter,
  setListingType as setListingTypeFilter,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import {
  COMMERCIAL_PROPERTY_OPTIONS,
} from "@/app/(pages)/postproperty/constants/subTypes";

type ListingType = "Buy" | "Rent";

const commercialCategories = COMMERCIAL_PROPERTY_OPTIONS.map(
  (option) => option.label,
);

const listingTypes: ListingType[] = ["Buy", "Rent"];

const getCommercialVariants = (category: string) => {
  if (category === "Office") {
    return [
      "Office",
      "Bare Shell Office",
      "Warm Shell Office",
      "Furnished Office",
    ];
  }

  return [category];
};

const getCategoryLinkGroups = (
  category: string,
  localities: string[],
  actionLabel: "Sale" | "Rent",
  cityName: string,
) => {
  const variants = getCommercialVariants(category);
  const formatCityLink = (label: string) =>
    `${label} for ${actionLabel} in ${cityName}`;
  const formatLocalityLinks = (locality: string) =>
    variants.map((variant) => `${variant} for ${actionLabel} in ${locality}`);

  return [
    {
      title: "Popular Commercial Spaces",
      links: variants.map(formatCityLink),
    },
    {
      title: `${category}s in Top Localities`,
      links: localities.slice(0, 2).flatMap(formatLocalityLinks),
    },
    {
      title: `${category}s by Locality`,
      links: localities.slice(2, 4).flatMap(formatLocalityLinks),
    },
    {
      title: "More Localities",
      links: localities.slice(4, 6).flatMap(formatLocalityLinks),
    },
  ];
};

const CommercialLinks = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { selectedCity } = useCity();
  const cityName = selectedCity?.city ?? "Hyderabad";
  const [listingType, setListingType] = useState<ListingType>("Buy");
  const [listingOpen, setListingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(commercialCategories[0]);
  const actionLabel = listingType === "Buy" ? "Sale" : "Rent";
  const cityLocalities =
    selectedCity?.localities
      ?.map((locality) => locality.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];
  const activeGroups = getCategoryLinkGroups(
    activeTab,
    cityLocalities,
    actionLabel,
    cityName,
  ).filter((group) => group.links.length > 0);
  const activeCommercialType =
    COMMERCIAL_PROPERTY_OPTIONS.find((option) => option.label === activeTab)
      ?.label ?? activeTab;

  const handleQuickLinkClick = (link: string) => {
    const locality = link.split(" in ").at(-1) ?? "";
    const selectedLocality = locality && locality !== cityName ? locality : "";

    dispatch(setCategory("Commercial"));
    dispatch(
      setListingTypeFilter({
        label: listingType,
        value: listingType === "Buy" ? "sale" : "rent",
      }),
    );
    dispatch(
      setCommercialFilter({
        key: "commercialType",
        value: [activeCommercialType],
      }),
    );
    dispatch(
      setCommercialFilter({
        key: "locality",
        value: selectedLocality ? [selectedLocality] : [],
      }),
    );
    dispatch(setSearchText(""));
    router.push("/properties");
  };

  return (
    <section className="py-1">
      <div className="relative inline-flex items-center gap-1 text-2xl font-medium text-[#171717]">
        <span>
          Find Your Commercial Space in {cityName} to{" "}
          <span className="text-[#18af5b]">{listingType}</span>
        </span>
        <button
          type="button"
          onClick={() => setListingOpen((prev) => !prev)}
          aria-label="Change listing type"
          className="flex h-7 w-7 items-center justify-center text-[#6b716e]"
        >
          <ArrowDropdownIcon
            size={12}
            className={`transition-transform ${listingOpen ? "rotate-180" : ""}`}
          />
        </button>

        {listingOpen && (
          <div className="absolute left-[360px] top-8 z-20 w-28 rounded-lg border border-gray-100 bg-white p-1 shadow-lg">
            {listingTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setListingType(type);
                  setListingOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  listingType === type
                    ? "bg-[#effcf4] text-[#18af5b]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ActiveTabs
          categories={commercialCategories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <div className="grid gap-8 px-1 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {activeGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-lg font-medium text-[#171717]">
              {group.title}
            </h3>
            <div className="mt-4 space-y-4">
              {group.links.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => handleQuickLinkClick(link)}
                  className="block text-left text-sm text-[#3d4541] transition hover:text-[#18af5b]"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommercialLinks;
