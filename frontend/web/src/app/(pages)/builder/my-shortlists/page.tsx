"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IoLocationOutline } from "react-icons/io5";


import ActiveTabs from "@/ui/ActiveTabs";
import { getUserShortlist } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import { GoHeartFill } from "react-icons/go";

/* ================= TYPES ================= */

interface PropertyDetails {
  _id: string;
  title?: string;
  address?: string;
  price?: number;
  priceFrom?: number;
  priceTo?: number;
  pricePerSqft?: number;
  slug?: string;
  gallery?: { url: string }[];
  gallerySummary?: { url: string }[];
  heroImage?: string;
  locality?: string;
  city?: string;
}
// Use backend's naming convention for the raw data type for type safety
type PropertyType =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural"
  | "FeaturedProject";
interface ShortlistedItem {
  _id: string;
  propertyType: PropertyType;
  property: PropertyDetails;
}

/* ================= COMPONENT ================= */

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");

  const categories = [
    "Residential",
    "Commercial",
    "Open Plot",
    "Agriculture Land",
    "Projects",
  ];

  const {
    data: shortlisted = [],
    isLoading,
    isError,
    error,
  } = useQuery<
    { data: ShortlistedItem[] },
    Error,
    ShortlistedItem[]
  >({
    queryKey: ["user-shortlist"],
    queryFn: getUserShortlist,
    select: (data) => data?.data ?? [],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading shortlisted properties...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error: {(error as Error).message}
      </div>
    );
  }

  const normalizeType = (type?: string) => {
    if (!type) return "";

    const normalized = type.toLowerCase().trim();

    if (normalized === "land" || normalized === "open plot") {
      return "open plot";
    }

    if (
      normalized === "agricultural" ||
      normalized === "agriculture" ||
      normalized === "agriculture land"
    ) {
      return "agriculture land";
    }

    if (
      normalized === "featuredproject" ||
      normalized === "featured project" ||
      normalized === "prime projects"
    ) {
      return "prime projects";
    }

    return normalized;
  };

  const filteredProperties = shortlisted.filter(
    (item) => normalizeType(item.propertyType) === normalizeType(activeTab)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Shortlisted Properties
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Explore the properties you have shortlisted and revisit the ones you
          liked most.
        </p>
      </div>

      {/* TABS */}
      <ActiveTabs
        categories={categories}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length ? (
          filteredProperties.map((item) => {
            const image =
              item.property?.gallery?.[0]?.url ||
              item.property?.gallerySummary?.[0]?.url ||
              item.property?.heroImage;

            const pricePerSqft =
              item.property?.price && item.property?.pricePerSqft
                ? Math.round(item.property.price / item.property.pricePerSqft)
                : null;

            const href =
              item.propertyType === "FeaturedProject"
                ? `/prime/${item.property?.slug}`
                : `/properties/${item.propertyType?.toLowerCase()}/${item.property?.slug}`;

            const price =
              item.property?.price ??
              item.property?.priceFrom ??
              item.property?.priceTo;

            const location =
              item.property?.address ||
              [item.property?.locality, item.property?.city]
                .filter(Boolean)
                .join(", ");

            return (
              <Link
                key={item._id}
                href={href}
                className="card bg-white rounded-xl overflow-hidden flex flex-col"
              >
                {/* IMAGE */}
                <div className="relative h-44">
                  <img
                    src={image}
                    alt={item.property?.title || "Property"}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow">
                    <GoHeartFill className="w-5 h-5 text-red-500" />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                    {item.property?.title || "Untitled Property"}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                    <IoLocationOutline  className="w-4 h-4 text-green-500" />
                    {location || "Location not specified"}
                  </div>
                </div>

                {/* ASIDE */}
                <aside className="mt-auto mx-1.5 mb-1.5 p-2 flex items-center justify-between bg-[#E9F7EF] rounded-xl">
                  {/* PRICE */}
                  <div className="flex flex-col pl-2 leading-tight">
                    <span className="text-[#21884B] font-semibold text-md">
                      ₹{" "}
                      {price
                        ? `${Math.round(
                            price / 100000
                          )} L`
                        : "—"}
                    </span>

                    <span className="text-xs text-gray-600">
                      {pricePerSqft
                        ? `₹ ${pricePerSqft.toLocaleString(
                            "en-IN"
                          )}/sqft`
                        : "—"}
                    </span>
                  </div>

                  {/* BUTTON */}
                  <button
                    className="bg-[#26ad5f] text-white text-sm font-medium px-4 py-2 rounded-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(
                        `Contact owner for ${
                          item.property?.title ?? "Property"
                        }`
                      );
                    }}
                  >
                    Contact Owner
                  </button>
                </aside>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="flex justify-center">
              <NopropertiesSvg />
            </div>
            No properties found in "{activeTab}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
