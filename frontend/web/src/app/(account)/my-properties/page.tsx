"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";

import ActiveTabs from "@/ui/ActiveTabs";
import { getMyProperties } from "@/data/ClientData";

/* -------------------- TYPES -------------------- */

interface Property {
  _id: string;
  title?: string;
  address?: string;
  price?: number;
  builtUpArea?: number;
  carpetArea?: number;
  slug?: string;
  gallery?: { url: string }[];
  propertyType?: string;
}

interface MyPropertiesResponse {
  totalCount: number;
  byType: {
    residentialCount: number;
    commercialCount: number;
    landCount: number;
    agriculturalCount: number;
    featuredCount: number;
  };
  residential: Property[];
  commercial: Property[];
  land: Property[];
  agricultural: Property[];
  featured: Property[];
}

/* -------------------- TAB MAP -------------------- */

const TAB_KEY_MAP: Record<string, keyof MyPropertiesResponse> = {
  Residential: "residential",
  Commercial: "commercial",
  Plot: "land",
  Agriculture: "agricultural",
};

/* -------------------- PAGE -------------------- */

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");

  const categories = ["Residential", "Commercial", "Plot", "Agriculture"];

  const { data, isLoading, isError, error } =
    useQuery<MyPropertiesResponse>({
      queryKey: ["myProperties"],
      queryFn: getMyProperties,
    });

  /* -------------------- FILTERED DATA -------------------- */

  const filteredProperties = useMemo(() => {
    if (!data) return [];
    const key = TAB_KEY_MAP[activeTab];
    return (data[key] as Property[]) ?? [];
  }, [data, activeTab]);

  /* -------------------- STATES -------------------- */

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

  /* -------------------- UI -------------------- */

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
            const image =
              property.gallery?.[0]?.url || "/placeholder.jpg";

            const area =
              property.carpetArea || property.builtUpArea;

            const pricePerSqft =
              property.price && area
                ? Math.round(property.price / area)
                : null;

            return (
              <Link
                key={property._id}
                href={`/properties/${property.propertyType ?? "residential"}/${property.slug}`}
                className="bg-white rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition"
              >
                {/* IMAGE */}
                <div className="relative h-44">
                  <img
                    src={image}
                    alt={property.title || "Property"}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-3 flex-1">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                    {property.title ?? "Untitled Property"}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                    <HiOutlineMapPin className="w-4 h-4 text-green-500" />
                    {property.address ?? "Location not specified"}
                  </div>
                </div>

                {/* FOOTER */}
                <aside className="m-2 p-2 flex items-center justify-between bg-[#E9F7EF] rounded-xl">
                  <div className="flex flex-col pl-2 leading-tight">
                    <span className="text-[#21884B] font-semibold text-md">
                      ₹{" "}
                      {property.price
                        ? `${Math.round(property.price / 100000)} L`
                        : "—"}
                    </span>

                    <span className="text-xs text-gray-600">
                      {pricePerSqft
                        ? `₹ ${pricePerSqft.toLocaleString("en-IN")}/sqft`
                        : "—"}
                    </span>
                  </div>

                  <button
                    className="bg-[#26ad5f] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-green-700 transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(
                        `Edit property: ${
                          property.title ?? "Property"
                        }`
                      );
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
            No properties found in "{activeTab}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
