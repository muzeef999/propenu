"use client";

import { useState, useMemo } from "react";
import { getMyContactedProperties } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import ActiveTabs from "@/ui/ActiveTabs";

import { HiOutlineLocationMarker } from "react-icons/hi";
import { FiArrowUpRight } from "react-icons/fi";

const Page = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["contactedProperties"],
    queryFn: getMyContactedProperties,
  });

  const properties = data?.properties ?? [];
  const categories = ["All", "sale", "rent"];
  const [activeTab, setActiveTab] = useState("All");

  const filteredProperties = useMemo(() => {
    if (activeTab === "All") return properties;
    return properties.filter((p: any) => p.listingType === activeTab);
  }, [activeTab, properties]);

  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            My Contacts Listing
          </h1>
          <p className="text-sm text-gray-500">
            Properties you have contacted ({properties.length})
          </p>
        </div>

        <ActiveTabs
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Grid */}
      {filteredProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          No contacted properties found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property: any) => (
            <div
              key={property.leadId}
              className="card rounded-xl overflow-hidden transition flex flex-col"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100 overflow-hidden rounded-t-xl">
                <Image
                  src={property.gallery}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />

                <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-600 text-white">
                  {property.listingType}
                </span>
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col flex-1">
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {property.title}
                  </h3>

                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <HiOutlineLocationMarker />
                    {property.locality}, {property.city}
                  </p>

                  <p className="text-xs text-gray-500">
                    Owner:{" "}
                    <span className="font-medium text-gray-700">
                      {property.owner.name}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                  {/* Price */}
                  <div className="flex flex-col leading-tight">
                    <p className="text-lg font-bold text-emerald-700">
                      ₹{property.price?.toLocaleString()}
                    </p>
                    <span className="text-xs text-emerald-600">
                      Total Price
                    </span>
                  </div>

                  {/* Action */}
                  <button className="flex items-center gap-2 rounded-md btn-primary px-6 py-2.5 text-sm font-semibold">
                    View
                    <FiArrowUpRight className="text-base" />
                  </button>
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
