"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";
import { HiHeart } from "react-icons/hi";

import ActiveTabs from "@/ui/ActiveTabs";
import { getShortlistedProperties } from "@/data/ClientData";

/* ================= TYPES ================= */

interface PropertyDetails {
  _id: string;
  title?: string;
  address?: string;
  price?: number;
  area?: number;
  slug?: string;
  gallery?: { url: string }[];
}

interface ShortlistedItem {
  _id: string;
  propertyType?: string;
  property: PropertyDetails;
}

/* ================= COMPONENT ================= */

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");

  const categories = ["Residential", "Commercial", "Plot", "Agriculture"];

  const {
    data: shortlisted = [],
    isLoading,
    isError,
    error,
  } = useQuery<ShortlistedItem[]>({
    queryKey: ["shortlistedProperties"],
    queryFn: getShortlistedProperties,
    select: (res) => res?.data ?? [],
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

  const filteredProperties = shortlisted.filter(
    (item) =>
      item.propertyType?.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
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
              "https://via.placeholder.com/400x300?text=No+Image";

            const pricePerSqft =
              item.property?.price && item.property?.area
                ? Math.round(item.property.price / item.property.area)
                : null;

            return (
              <Link
                key={item._id}
                href={`/properties/residential/${item.property.slug}`}
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
                    <HiHeart className="w-5 h-5 text-red-500" />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                    {item.property?.title || "Untitled Property"}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <HiOutlineMapPin className="w-4 h-4 text-green-500" />
                    {item.property?.address || "Location not specified"}
                  </div>
                </div>

                {/* ASIDE */}
                <aside className="mt-auto mx-1.5 mb-1.5 p-2 flex items-center justify-between bg-[#E9F7EF] rounded-xl">
                  {/* PRICE */}
                  <div className="flex flex-col pl-2 leading-tight">
                    <span className="text-[#21884B] font-semibold text-md">
                      ₹{" "}
                      {item.property?.price
                        ? `${Math.round(
                            item.property.price / 100000
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
            No properties found in "{activeTab}" category
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
