"use client";

import { useState } from "react";
import Link from "next/link";
import ActiveTabs from "@/ui/ActiveTabs";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";

interface Property {
  _id: string;
  title?: string;
  address?: string;
  price?: number;
  area?: number;
  slug?: string;
  gallery?: { url: string }[];
  propertyType?: string;
}

interface MyPropertiesResponse {
  data: Property[];
}

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");

  const categories = ["Residential", "Commercial", "Plot", "Agriculture"];

  const { data = [], isLoading, isError, error } = useQuery<MyPropertiesResponse>({
    queryKey: ["myProperties"],
    // queryFn: getMyProperties, // Uncomment and implement this function to fetch data
    select: (res) => res?.data ?? [],
  });

  const filteredProperties = (data as Property[]).filter(
    (item) =>
      item.propertyType?.toLowerCase() === activeTab.toLowerCase() ||
      !item.propertyType // Include items without propertyType
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading your properties...
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
  console.log("Filtered Properties:", filteredProperties);

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
          filteredProperties.map((property) => {
            const image = property?.gallery?.[0]?.url || "/placeholder.jpg";
            const pricePerSqft =
              property?.price && property?.area
                ? Math.round(property.price / property.area)
                : null;

            return (
              <Link
                key={property._id}
                href={`/properties/${property.propertyType?.toLowerCase() || "residential"}/${property.slug}`}
                className="card bg-white rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition"
              >
                {/* IMAGE */}
                <div className="relative h-44">
                  <img
                    src={image}
                    alt={property?.title || "Property"}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                    {property?.title || "Untitled Property"}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <HiOutlineMapPin className="w-4 h-4 text-green-500" />
                    {property?.address || "Location not specified"}
                  </div>
                </div>

                {/* ASIDE */}
                <aside className="mt-auto mx-1.5 mb-1.5 p-2 flex items-center justify-between bg-[#E9F7EF] rounded-xl">
                  {/* PRICE */}
                  <div className="flex flex-col pl-2 leading-tight">
                    <span className="text-[#21884B] font-semibold text-md">
                      ₹{" "}
                      {property?.price
                        ? `${Math.round(property.price / 100000)} L`
                        : "—"}
                    </span>

                    <span className="text-xs text-gray-600">
                      {pricePerSqft
                        ? `₹ ${pricePerSqft.toLocaleString("en-IN")}/sqft`
                        : "—"}
                    </span>
                  </div>

                  {/* BUTTON */}
                  <button
                    className="bg-[#26ad5f] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(`Edit property: ${property?.title ?? "Property"}`);
                    }}
                  >
                    Edit
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