"use client";

import { useState, useMemo } from "react";
import { getMyContactedProperties } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import ActiveTabs from "@/ui/ActiveTabs";

import { HiOutlineLocationMarker } from "react-icons/hi";
import { FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";

const PROPERTY_TYPE_ROUTE_MAP: Record<string, string> = {
  residentials: "residential",
  commercials: "commercial",
  landplots: "land",
  agriculturals: "agricultural",
  featuredprojects: "featured",
};

const Page = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["contactedProperties"],
    queryFn: getMyContactedProperties,
  });

  const properties = data?.properties ?? [];
  const categories = ["All", "Sale", "Rent"];
  const [activeTab, setActiveTab] = useState("All");

  const filteredProperties = useMemo(() => {
    if (activeTab === "All") return properties;

    return properties.filter(
      (p: any) => p.listingType?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, properties]);


  if (isLoading) {
    return <p className="p-6 text-center text-sm text-gray-500">Loading...</p>;
  }


  return (
    <div className="mx-auto w-full space-y-4">
      <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Contacted Properties
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Revisit the properties you contacted and quickly jump back into the
          listings that matter most.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Properties you have contacted ({properties.length})
          </p>
        </div>
        <div className="w-full md:w-auto">
          <ActiveTabs
            categories={categories}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          No contacted properties found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProperties.map((property: any) => (
            <div
              key={property.leadId}
              className="card rounded-xl overflow-hidden transition flex flex-col"
            >
              {/* Image */}
              <div className="relative h-44 sm:h-40 bg-gray-100 overflow-hidden rounded-t-xl">
                <Image
                  src={property.gallery || "/placeholder.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />

                <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-md font-medium bg-[#26ad5f] text-white">
                  {property.listingType === "rent" ? "Rent" : "Sale"}
                </span>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {property.title}
                  </h3>

                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <HiOutlineLocationMarker />
                    {property.locality || property.city
                      ? `${property.locality || ""}${property.locality && property.city ? ", " : ""}${property.city || ""}`
                      : "Location unavailable"}
                  </p>

                  <p className="text-xs text-gray-500">
                    Owner:{" "}
                    <span className="font-medium text-gray-700">
                      {property.owner?.name || "N/A"}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">

                  {/* Price */}
                  <div className="flex flex-col leading-tight">
                    <p className="font-bold text-[#27AE60] text-base sm:text-lg">
                      {property.price
                        ? `₹${property.price.toLocaleString()}`
                        : "Price on request"}
                    </p>
                    <span className="text-xs text-emerald-600">
                      Total Price
                    </span>
                  </div>

                  {/* Action */}
                  {property.slug &&
                    PROPERTY_TYPE_ROUTE_MAP[property.propertyType] && (
                      <Link
                        href={`/properties/${PROPERTY_TYPE_ROUTE_MAP[property.propertyType]}/${property.slug}`}
                      >
                        <button className="flex items-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-semibold whitespace-nowrap">
                          View
                          <FiArrowUpRight className="text-base" />
                        </button>
                      </Link>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
