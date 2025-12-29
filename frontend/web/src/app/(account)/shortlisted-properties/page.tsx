"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";
import { HiHeart } from "react-icons/hi";
import ActiveTabs from "@/ui/ActiveTabs";
import { getShortlistedProperties } from "@/data/ClientData";

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");

  const categories = ["Residential", "Commercial", "Plot", "Agriculture"];

  const {
    data: shortlisted = [],
    isLoading,
    isError,
    error,
  } = useQuery({
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
    (item: any) =>
      item.propertyType?.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <ActiveTabs
        categories={categories}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length ? (
          filteredProperties.map((item: any) => {
            const image =
              item.property?.gallery?.[0]?.url ||
              "https://via.placeholder.com/400x300?text=No+Image";

            return (
              <div key={item._id} className="card relative">
                {/* Image */}
                <div className="relative h-44 overflow-hidden rounded-t-xl">
                  <img
                    src={image}
                    alt={item.property?.title || "Property"}
                    className="h-full w-full object-cover"
                  />

                  {/* Heart Icon */}
                  <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm">
                    <HiHeart className="w-5 h-5 text-red-500" />
                  </div>

                  {/* Property Type */}
                  <span className="absolute bottom-3 left-3 text-xs bg-[#26ad5f] text-white px-3 py-1 rounded-full">
                    {item.propertyType}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  {/* Title + Price */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-1">
                      {item.property?.title || "Untitled Property"}
                    </h3>

                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                      ₹
                      {item.property?.price
                        ? item.property.price.toLocaleString("en-IN")
                        : "—"}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <HiOutlineMapPin className="w-4 h-4 text-emerald-500" />
                    {item.property?.city || "Location not specified"}
                  </div>

                  {/* CTA */}
                  <button className="mt-3 text-sm font-semibold text-emerald-600 hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
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
