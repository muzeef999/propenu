"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";

import ActiveTabs from "@/ui/ActiveTabs";
import { deactivateMyProperty, getMyProperties } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import SelectableButton from "@/ui/SelectableButton";
import { useResponses } from "../ResponsesContext";
import { useAppDispatch } from "@/Redux/store";
import {
  setPropertyType,
  type PropertyCategory,
} from "@/Redux/slice/postPropertySlice";

/* ================= TYPES ================= */

interface Property {
  _id: string;
  title?: string;
  listingType?: string;
  address?: string;
  price?: number;
  builtUpArea?: number;
  carpetArea?: number;
  slug?: string;
  gallery?: { url: string }[];
  propertyType?: string;
  createdAt?: string;
  status?: "Active" | "Draft" | "Deactivated" | string;
  isPublished?: boolean;

  meta?: {
    views?: number;
    inquiries?: number;
    enquiries?: number;
  };
}

/* ================= TAB MAP ================= */

const TAB_KEY_MAP: Record<string, string> = {
  Residential: "residential",
  Commercial: "commercial",
  "Open Plot": "land",
  "Agriculture land": "agricultural",
};

const categoriesDropdown = [
  { label: "All", value: "all" },
  { label: "Buy", value: "sale" },
  { label: "Rent / Lease", value: "other" },
];
const getCategoryForTab = (tab: string): PropertyCategory => {
  const category = TAB_KEY_MAP[tab];
  if (
    category === "residential" ||
    category === "commercial" ||
    category === "land" ||
    category === "agricultural"
  ) {
    return category;
  }
  return "residential";
};

const formatPropertyPrice = (price?: number) => {
  if (price == null || Number.isNaN(price) || price <= 0) {
    return "—";
  }

  if (price < 100000) {
    return `₹ ${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price)}`;
  }

  if (price < 10000000) {
    const lakhs = price / 100000;
    return `₹ ${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: lakhs < 10 ? 2 : 1,
    }).format(lakhs)} Lac`;
  }

  const crores = price / 10000000;
  return `₹ ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: crores < 10 ? 2 : 1,
  }).format(crores)} Cr`;
};

const Page = () => {
  const categories = ["Residential", "Commercial", "Open Plot", "Agriculture land"];
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState("Residential");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "All" | "Active" | "Draft" | "Deactivated"
  >("All");
  const [listingTypeFilter, setListingTypeFilter] = useState<
    "all" | "sale" | "other"
  >(
    "all"
  );
  const [isListingTypeOpen, setIsListingTypeOpen] = useState(false);
  const listingTypeRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const shouldShowCategory = useMemo(() => {
    if (!data) return undefined;

    return (category: string) => {
      const key = TAB_KEY_MAP[category];
      const items = data[key];
      return Array.isArray(items) && items.length > 0;
    };
  }, [data, categories]);

  function ResponsesButton({
    propertyId,
    count,
  }: {
    propertyId: string;
    count: number;
  }) {
    const { setActiveProjectId, setOpenResponses } = useResponses();
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setActiveProjectId(propertyId);
          setOpenResponses(true);
        }}
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:border-green-300 hover:bg-green-100"
      >
        <span>Responses</span>
      </button>
    );
  }

  /* ================= FILTER LOGIC ================= */

  const filteredProperties = useMemo(() => {
    if (!data) return [];

    let list: Property[] = data[TAB_KEY_MAP[activeTab]] ?? [];

    if (listingTypeFilter === "sale") {
      list = list.filter((p) => String(p.listingType ?? "").toLowerCase() === "sale");
    } else if (listingTypeFilter === "other") {
      list = list.filter((p) =>
        ["rent", "lease"].includes(String(p.listingType ?? "").toLowerCase()),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }

    if (status !== "All") {
      const desired = status.toLowerCase();
      list = list.filter((p) => String(p.status ?? "").toLowerCase() === desired);
    }

    return list;
  }, [data, activeTab, search, status, listingTypeFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listingTypeRef.current &&
        !listingTypeRef.current.contains(event.target as Node)
      ) {
        setIsListingTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedListingTypeLabel =
    categoriesDropdown.find((item) => item.value === listingTypeFilter)?.label ??
    "Listing Type";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading your properties…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-4 py-4 sm:rounded-2xl sm:px-5 sm:py-6">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl">
          My Properties
        </h1>
        <p className="mt-1.5 text-xs leading-5 text-gray-600 sm:mt-2 sm:text-sm md:text-base">
          Manage your listed properties, track responses, and keep an eye on
          their status in one place.
        </p>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">        {/* Tabs */}
        <ActiveTabs
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          shouldShowCategory={shouldShowCategory}
        />

        {/* Filtered count */}
        <div className="flex items-center gap-2 px-1">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:px-3">
            {filteredProperties.length}
          </span>
          <span className="text-xs text-gray-500 sm:text-sm sm:text-gray-600">properties found</span>
        </div>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter locality"
          className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-green-500 lg:w-56"
        />

        {/* Status Filters */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:ml-auto lg:flex-wrap lg:overflow-visible lg:pb-0">
          {[
            "All",
            "Active",
            "Draft",
            "Deactivated",
          ].map((item) => (
            <SelectableButton
              key={item}
              label={item}
              active={status === item}
              selectionType="single"
              onClick={() => setStatus(item as any)}
              className="shrink-0 px-2.5 py-1 text-xs sm:px-3"
            />
          ))}
        </div>

        {/* Listing Type Dropdown */}
        <div ref={listingTypeRef} className="relative w-full shrink-0 lg:w-44">
          <button
            type="button"
            onClick={() => setIsListingTypeOpen((prev) => !prev)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>{selectedListingTypeLabel}</span>
            <FiChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${isListingTypeOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isListingTypeOpen && (
            <div className="absolute right-0 top-11 z-20 w-full lg:w-44 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
              <div className="space-y-2">
                {categoriesDropdown.map((item) => (
                  <SelectableButton
                    key={item.value}
                    label={item.label}
                    active={listingTypeFilter === item.value}
                    selectionType="single"
                    onClick={() => {
                      setListingTypeFilter(
                        item.value as "all" | "sale" | "other",
                      );
                      setIsListingTypeOpen(false);
                    }}
                    className="w-full justify-start px-3 py-2 text-xs"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className="space-y-3 sm:space-y-4">
        {filteredProperties.length ? (
          filteredProperties.map((property) => {
            const image = property.gallery?.[0]?.url || "/placeholder.jpg";
            const statusLower = String(property.status ?? "").toLowerCase();
            const isActive =
              statusLower === "active" ||
              statusLower === "approved" ||
              Boolean(property.isPublished);
            const isDraft = statusLower === "draft";
            const isPending = statusLower === "pending";
            const propertyCategory =
              TAB_KEY_MAP[activeTab] ?? "residential";

            return (
              <Link
                key={property._id}
                href={
                  isDraft
                    ? "/postproperty"
                    : `/properties/${propertyCategory}/${property.slug}`
                }
                onClick={() => {
                  if (isDraft) {
                    dispatch(setPropertyType(getCategoryForTab(activeTab)));
                  }
                }}
                className="group relative mx-auto flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 transition-all duration-300 hover:shadow-md sm:mx-0 sm:max-w-none sm:gap-3 sm:p-3 md:flex-row md:items-center md:gap-4 md:rounded-2xl"
              >
                {/* Image */}
                <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-50 md:h-44 md:w-40 md:rounded-lg lg:h-45 lg:w-48">
                  <img
                    src={image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col">

                  {/* Title + Status */}
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">

                    {/* Left */}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 md:text-lg">
                        {property.title ?? "Untitled Property"}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                        <HiOutlineMapPin className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="truncate">
                          {property.address ?? "Location not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`self-start sm:self-auto inline-block rounded-full px-3 py-1 text-xs font-medium capitalize whitespace-nowrap ${isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : isDraft
                            ? "bg-amber-100 text-amber-700"
                            : isPending
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {property.status ?? "Draft"}
                    </span>
                  </div>


                  {/* Property Details */}
                  <div className="mt-3 grid grid-cols-1 gap-y-1.5 text-xs text-gray-600 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:text-sm">

                    <p className="flex justify-between gap-3 sm:block">
                      <span className="text-gray-500">Price:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {formatPropertyPrice(property.price)}
                      </span>
                    </p>

                    <p className="flex justify-between gap-3 sm:block">
                      <span className="text-gray-500">Property ID:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property._id.slice(-8).toUpperCase()}
                      </span>
                    </p>

                    <p className="flex justify-between gap-3 sm:block">
                      <span className="text-gray-500">Carpet Area:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property.carpetArea
                          ? `${property.carpetArea} sq.ft.`
                          : "—"}
                      </span>
                    </p>

                    <p className="flex justify-between gap-3 sm:block">
                      <span className="text-gray-500">Posted On:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {property.createdAt
                          ? new Date(property.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "—"}
                      </span>
                    </p>

                  </div>

                  {/* Non-Active Status Message Banner at Bottom */}
                  {!isActive && (
                    <div className="mt-3">
                      {isDraft ? (
                        <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:px-3 sm:py-1.5">
                          Draft — Complete listing
                        </span>
                      ) : isPending ? (
                        <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:px-3 sm:py-1.5">
                          Under Review — Pending
                        </span>
                      ) : (
                        <span className="inline-block rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 sm:px-3 sm:py-1.5">
                          Listing Inactive
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="mt-2 flex w-full flex-row items-center justify-between gap-3 border-t border-gray-100 pt-2 md:mt-0 md:w-32 md:flex-col md:items-end md:border-t-0 md:pt-0">

                  {/* Menu Button */}
                  <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((prev) =>
                          prev === property._id ? null : property._id
                        );
                      }}
                      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 transition"
                    >
                      <HiOutlineDotsVertical className="h-5 w-5" />
                    </button>

                    {openMenuId === property._id && (
                      <div
                        className="absolute right-0 top-10 z-30 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const category = getCategoryForTab(activeTab);
                            const params = new URLSearchParams({
                              editCategory: category,
                              editId: property._id,
                            });
                            const listingType = String(
                              property.listingType ?? "",
                            ).trim();

                            if (listingType) {
                              params.set("listingType", listingType);
                            }

                            dispatch(setPropertyType(category));
                            setOpenMenuId(null);
                            router.push(`/postproperty?${params.toString()}`);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setDeactivatingId(property._id);
                            setOpenMenuId(null);
                            try {
                              await deactivateMyProperty(
                                property._id,
                                propertyCategory
                              );
                              await refetch();
                            } finally {
                              setDeactivatingId(null);
                            }
                          }}
                          disabled={deactivatingId === property._id}
                          className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {deactivatingId === property._id
                            ? "Deactivating..."
                            : "Deactivate"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats Section (only for Active properties) */}
                  {isActive && (
                    <div className="flex gap-3 text-left text-xs text-gray-600 md:block md:space-y-1 md:pr-2 md:text-right">
                      <p>
                        Views:{" "}
                        <span className="font-medium text-gray-800">
                          {property.meta?.views ?? 0}
                        </span>
                      </p>

                      <p>
                        Enquiries:{" "}
                        <span className="font-medium text-gray-800">
                          {property.meta?.inquiries ?? property.meta?.enquiries ?? 0}
                        </span>
                      </p>

                      <ResponsesButton
                        propertyId={property._id}
                        count={
                          property.meta?.inquiries ?? property.meta?.enquiries ?? 0
                        }
                      />
                    </div>
                  )}

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
