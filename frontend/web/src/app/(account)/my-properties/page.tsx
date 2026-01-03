"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";
import { FiEdit2 } from "react-icons/fi";

import ActiveTabs from "@/ui/ActiveTabs";
import { getMyProperties } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import SelectableButton from "@/ui/SelectableButton";
import Dropdownui from "@/ui/DropDownUI";

/* ================= TYPES ================= */

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
  createdAt?: string;
  status?: "Active" | "Deactive" | "Reported";

  meta?: {
    views?: number;
    enquiries?: number;
  };
}

/* ================= TAB MAP ================= */

const TAB_KEY_MAP: Record<string, string> = {
  Residential: "residential",
  Commercial: "commercial",
  Plot: "land",
  Agriculture: "agricultural",
};

const categoriesDropdown = [
  { label: "Buy", value: "buy" },
  { label: "Rent / Lease", value: "rent / lease" },
];
const Page = () => {
  const categories = ["Residential", "Commercial", "Plot", "Agriculture"];

  const [activeTab, setActiveTab] = useState("Residential");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "All" | "Active" | "Reported" | "Subscription Expired" | "Deactivate"
  >("All");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
  });

  /* ================= FILTER LOGIC ================= */

  const filteredProperties = useMemo(() => {
    if (!data) return [];

    let list: Property[] = data[TAB_KEY_MAP[activeTab]] ?? [];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }

    // Status filter (frontend-ready)
    if (status !== "All") {
      list = list.filter((p) => p.status === status);
    }

    return list;
  }, [data, activeTab, search, status]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading your properties…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-1">
      {/* ================= TABS ================= */}
      <ActiveTabs
        categories={categories}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* ================= FILTER BAR ================= */}
      <div className="flex items-center gap-4">
        {/* LEFT: Search */}
        <div className="shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter Locality"
            className="h-9 w-48 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-green-500"
          />
        </div>

        {/* CENTER: Status Filters */}
        <div className="flex flex-1 justify-end gap-2">
          {[
            "All",
            "Active",
            "Reported",
            "Subscription Expired",
            "Deactivate",
          ].map((item) => (
            <SelectableButton
              key={item}
              label={item}
              active={status === item}
              selectionType="single"
              onClick={() => setStatus(item as any)}
              className="px-3 py-1 text-xs"
            />
          ))}
        </div>

        {/* RIGHT: Category Dropdown */}
        <div className="w-30 h-14 shrink-0">
          <Dropdownui
            label=""
            placeholder="Category"
            value={activeTab}
            options={categoriesDropdown}
            onChange={(val) => setActiveTab(val)}
          />
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className="space-y-4">
        {filteredProperties.length ? (
          filteredProperties.map((property) => {
            const image = property.gallery?.[0]?.url || "/placeholder.jpg";

            return (
              <Link
                key={property._id}
                href={`/properties/${property.propertyType ?? "residential"}/${
                  property.slug
                }`}
                className="card group flex flex-row items-start gap-5 border border-gray-200 p-2"
              >
                {/* Image */}
                <div className="w-55 shrink-0 overflow-hidden rounded-lg bg-gray-100 aspect-4/3">
                  <img
                    src={image}
                    alt={property.title}
                    className="h-50  object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 max-w-[380px]">
                      <h3 className="truncate text-lg font-semibold text-gray-900 ">
                        {property.title ?? "Untitled Property"}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 truncate">
                        <HiOutlineMapPin className="h-4 w-4 text-green-600 shrink-0 " />
                        {property.address ?? "Location not specified"}
                      </div>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-gray-600">
                    <p>
                      <span className="text-gray-500">Price:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property.price
                          ? `₹ ${Math.round(property.price / 100000)} Lac`
                          : "—"}
                      </span>
                    </p>

                    <p>
                      <span className="text-gray-500">Property ID:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property._id.slice(-8).toUpperCase()}
                      </span>
                    </p>

                    <p>
                      <span className="text-gray-500">Carpet Area:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property.carpetArea
                          ? `${property.carpetArea} sq.ft.`
                          : "—"}
                      </span>
                    </p>

                    <p>
                      <span className="text-gray-500">Posted On:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property.createdAt
                          ? new Date(property.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex w-28 flex-col items-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Edit ${property.title}`);
                    }}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>

                  <div className="mt-auto text-xs text-gray-500 text-right space-y-1">
                    <p>
                      Views:{" "}
                      <span className="font-medium text-gray-700">
                        {property.meta?.views ?? 0}
                      </span>
                    </p>
                    <p>
                      Enquiries:{" "}
                      <span className="font-medium text-gray-700">
                        {property.meta?.enquiries ?? 0}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-16 text-center text-gray-500">
            <div className="mx-auto mb-4 flex justify-center">
              <NopropertiesSvg />
            </div>
            No properties found in <b>{activeTab}</b>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
