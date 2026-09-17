"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { HiOutlineMapPin } from "react-icons/hi2";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";

import ActiveTabs from "@/ui/ActiveTabs";
import SelectableButton from "@/ui/SelectableButton";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import { getMyProperties } from "@/data/ClientData";
import { useAppDispatch } from "@/Redux/store";
import {
  setPropertyType,
  type PropertyCategory,
} from "@/Redux/slice/postPropertySlice";

/* ================= TYPES ================= */

interface Property {
  _id: string;
  title?: string;
  listingType?: "sale" | "rent" | "lease";
  address?: string;
  price?: number;
  builtUpArea?: number;
  carpetArea?: number;
  slug?: string;
  gallery?: { url: string }[];
  propertyType?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
  status?: "Active" | "Draft" | "Approved" | "Pending" | "Under Review" | string;
  verificationDocuments?: { status?: string }[];
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
  "Open Plot": "land",
  Agriculture: "agricultural",
  "Agriculture Land": "agricultural",
};

const categories = ["Residential", "Commercial", "Open Plot", "Agriculture Land"];

const listingTypeOptions = [
  { label: "All", value: "all" },
  { label: "Buy", value: "sale" },
  { label: "Rent / Lease", value: "rent" },
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

/* ================= PAGE ================= */

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState("all");
  const [isListingTypeOpen, setIsListingTypeOpen] = useState(false);
  const listingTypeRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"All" | "Active" | "Pending" | "Draft">("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
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
  }, [data]);

  /* ================= FILTER LOGIC ================= */

  const filteredProperties = useMemo(() => {
    if (!data) return [];

    let list: Property[] = data[TAB_KEY_MAP[activeTab]] ?? [];

    if (listingType === "sale") {
      list = list.filter((p) => p.listingType === "sale");
    } else if (listingType === "rent") {
      list = list.filter((p) => p.listingType === "rent" || p.listingType === "lease");
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
      list = list.filter(
        (p) => (p.status ?? "").toLowerCase() === desired
      );
    }

    return list;
  }, [data, activeTab, search, status, listingType]);

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
    listingTypeOptions.find((item) => item.value === listingType)?.label ??
    "Listing Type";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading your properties…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ================= HEADER ================= */}
      <div className="items-start justify-between">
        <div className="mb-3 rounded-xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-4 py-4 sm:mb-4 sm:rounded-2xl sm:px-5 sm:py-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl">
            My Properties
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-gray-600 sm:mt-2 sm:text-sm md:text-base">
            View and manage your properties, track activity, and keep your
            listings organized in one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div>
            <ActiveTabs
              categories={categories}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              shouldShowCategory={shouldShowCategory}
            />
          </div>

          {/* Filtered count */}
          <div className="flex items-center gap-2 px-1 lg:shrink-0">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:px-3">
              {filteredProperties.length}
            </span>
            <span className="text-xs text-gray-500 sm:text-sm sm:text-gray-600">properties found</span>
          </div>
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
          {(["All", "Active", "Pending", "Draft"] as const).map((item) => (
            <SelectableButton
              key={item}
              label={item}
              active={status === item}
              selectionType="single"
              onClick={() => setStatus(item)}
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
                {listingTypeOptions.map((item) => (
                  <SelectableButton
                    key={item.value}
                    label={item.label}
                    active={listingType === item.value}
                    selectionType="single"
                    onClick={() => {
                      setListingType(item.value);
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
            const image = property.gallery?.[0]?.url ?? "/placeholder.jpg";
            const tracking = getTrackingState(property);
            const statusLower = String(property.status ?? "").toLowerCase();
            const isActive =
              statusLower === "active" ||
              statusLower === "approved" ||
              Boolean(property.isPublished);

            return (
              <Link
                key={property._id}
                href={`/properties/${TAB_KEY_MAP[activeTab]}/${property.slug}`}
                className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 transition hover:shadow-sm sm:gap-4 sm:p-3 md:flex-row"
              >
                {/* Image */}
                <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:aspect-4/3 md:w-52 lg:w-56">
                  <img
                    src={image}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="min-w-0 sm:max-w-[420px]">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 sm:truncate sm:text-lg">
                        {property.title ?? "Untitled Property"}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500 sm:text-sm">
                        <HiOutlineMapPin className="h-4 w-4 text-green-600 shrink-0" />
                        {property.address ?? "Location not specified"}
                      </div>
                    </div>

                    {property.status && (
                      <span
                        className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize sm:px-3 sm:py-1 sm:text-xs ${getStatusStyle(
                          property.status
                        )}`}
                      >
                        {property.status}
                      </span>
                    )}
                  </div>


                  <div className="mt-3 grid grid-cols-1 gap-y-1.5 text-xs text-gray-600 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:text-sm lg:gap-x-12">
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

                  <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2.5 sm:px-3 sm:py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-700">
                        Tracking
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-[11px] ${tracking.badgeClass}`}
                      >
                        {tracking.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 items-start gap-1.5 sm:gap-2">
                      {tracking.steps.map((step, index) => (
                        <div key={step.label} className="min-w-0">
                          <div className="flex items-center">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold sm:h-5 sm:w-5 sm:text-[10px] ${step.active
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 bg-white text-gray-400"
                                }`}
                            >
                              {index + 1}
                            </span>
                            {index < tracking.steps.length - 1 && (
                              <span
                                className={`mx-1 h-0.5 flex-1 rounded-full ${tracking.steps[index + 1].active
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                                  }`}
                              />
                            )}
                          </div>
                          <p
                            className={`mt-1 truncate text-[10px] font-medium sm:text-[11px] ${step.active ? "text-gray-800" : "text-gray-400"
                              }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex w-full flex-row items-center justify-between gap-3 border-t border-gray-100 pt-2 md:w-28 md:shrink-0 md:flex-col md:items-end md:justify-start md:border-t-0 md:pt-0">
                  <div className="relative order-2 md:order-1 self-end md:self-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((prev) =>
                          prev === property._id ? null : property._id
                        );
                      }}
                      className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                    >
                      <HiOutlineDotsVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === property._id && (
                      <div
                        className="absolute right-0 top-10 z-20 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md"
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
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className="order-1 flex gap-3 text-left text-xs text-gray-500 md:order-2 md:mt-auto md:block md:space-y-1 md:text-right">
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
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-12 sm:py-16 text-center text-gray-500">
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

const getStatusStyle = (status?: string) => {
  switch (String(status ?? "").toLowerCase()) {
    case "active":
      return "bg-green-50 text-green-600 border-green-200";

    case "pending":
    case "under review":
    case "under-review":
      return "bg-amber-50 text-amber-600 border-amber-200";

    case "draft":
      return "bg-yellow-50 text-yellow-600 border-yellow-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

const getTrackingState = (property: Property) => {
  const status = String(property.status ?? "").toLowerCase();
  const hasVerifiedDocument = property.verificationDocuments?.some(
    (doc) => String(doc.status ?? "").toLowerCase() === "verified"
  );
  const isApproved =
    property.isPublished ||
    hasVerifiedDocument ||
    ["active", "approved", "verified", "published"].includes(status);
  const isDraft = status === "draft";
  const isUnderReview =
    !isDraft &&
    !isApproved &&
    ["pending", "under review", "under-review", "review"].includes(status);

  const currentStep = isApproved ? 3 : isUnderReview || !isDraft ? 2 : 1;
  const label = isApproved
    ? "Approved & Live"
    : currentStep === 2
      ? "Under Review"
      : "Draft";
  const badgeClass = isApproved
    ? "bg-green-100 text-green-700"
    : currentStep === 2
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-600";

  return {
    label,
    badgeClass,
    steps: [
      {
        label: currentStep >= 2 || isApproved ? "Submitted" : "Ongoing",
        active: currentStep >= 1,
      },
      { label: "Under Review", active: currentStep >= 2 },
      { label: "Approved & Live", active: currentStep >= 3 },
    ],
  };
};


export default Page;
