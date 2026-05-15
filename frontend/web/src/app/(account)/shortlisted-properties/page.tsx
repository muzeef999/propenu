"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiShare2 } from "react-icons/fi";
import { toast } from "sonner";

import ActiveTabs from "@/ui/ActiveTabs";
import { getUserShortlist, removeShortlistProperty } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import { GoHeartFill } from "react-icons/go";
import formatINR from "@/utilies/PriceFormat";

/* ================= TYPES ================= */

interface PropertyDetails {
  _id: string;
  title?: string;
  address?: string;
  price?: number;
  priceFrom?: number;
  priceTo?: number;
  pricePerSqft?: number;
  carpetArea?: number;
  builtUpArea?: number;
  plotArea?: number;
  slug?: string;
  gallery?: { url: string }[];
  gallerySummary?: { url: string }[];
  heroImage?: string;
  locality?: string;
  city?: string;
  bedrooms?: number;
  propertyType?: string;
  listingType?: string;
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

// Normalize backend types and tab labels so filtering stays consistent.
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
    normalized === "projects"
  ) {
    return "projects";
  }

  return normalized;
};

const formatPrice = (property?: PropertyDetails) => {
  const price = property?.price ?? property?.priceFrom ?? property?.priceTo;
  if (!price) return "—";

  if (property?.priceFrom && property?.priceTo) {
    return `${formatINR(property.priceFrom)} - ${formatINR(property.priceTo)}`;
  }

  return formatINR(price);
};

const getArea = (property?: PropertyDetails) => {
  const explicitArea =
    property?.carpetArea ?? property?.builtUpArea ?? property?.plotArea;

  if (explicitArea) return explicitArea;

  if (property?.price && property?.pricePerSqft) {
    return Math.round(property.price / property.pricePerSqft);
  }

  return null;
};

const getTitle = (item: ShortlistedItem) => {
  const property = item.property;
  if (property?.title) return property.title;

  const listingLabel =
    property?.listingType?.toLowerCase() === "rent" ? "rent" : "sale";

  if (item.propertyType === "Residential" && property?.bedrooms) {
    return `${property.bedrooms} BHK Apartment for ${listingLabel}`;
  }

  return "Untitled Property";
};

const shareProperty = async (title: string, href: string) => {
  const url = `${window.location.origin}${href}`;

  if (navigator.share) {
    await navigator.share({ title, url });
    return;
  }

  await navigator.clipboard?.writeText(url);
};

/* ================= COMPONENT ================= */

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");
  const queryClient = useQueryClient();

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

  const removeShortlistMutation = useMutation({
    mutationFn: removeShortlistProperty,
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });

      const previousShortlist = queryClient.getQueryData<{
        data: ShortlistedItem[];
      }>(["user-shortlist"]);

      queryClient.setQueryData<{ data: ShortlistedItem[] }>(
        ["user-shortlist"],
        (old) => ({
          ...old,
          data: (old?.data ?? []).filter(
            (item) => item.property?._id !== propertyId
          ),
        })
      );

      return { previousShortlist };
    },
    onSuccess: () => {
      toast.success("Removed from shortlist");
    },
    onError: (_error, _propertyId, context) => {
      if (context?.previousShortlist) {
        queryClient.setQueryData(
          ["user-shortlist"],
          context.previousShortlist
        );
      }

      toast.error("Failed to remove from shortlist");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
    },
  });

  const shouldShowCategory = useCallback(
    (category: string) =>
      shortlisted.some(
        (item) => normalizeType(item.propertyType) === normalizeType(category)
      ),
    [shortlisted]
  );

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
        shouldShowCategory={shouldShowCategory}
      />

      {/* CARDS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredProperties.length ? (
          filteredProperties.map((item) => {
            const image =
              item.property?.gallery?.[0]?.url ||
              item.property?.gallerySummary?.[0]?.url ||
              item.property?.heroImage ||
              "/placeholder.jpg";

            const href =
              item.propertyType === "FeaturedProject"
                ? `/prime/${item.property?.slug}`
                : `/properties/${item.propertyType?.toLowerCase()}/${item.property?.slug}`;

            const location =
              [item.property?.locality, item.property?.city]
                .filter(Boolean)
                .join(", ") ||
              item.property?.address;

            const area = getArea(item.property);
            const pricePerSqft = item.property?.pricePerSqft;

            return (
              <Link
                key={item._id}
                href={href}
                className="group flex min-h-[145px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* IMAGE */}
                <div className="relative w-[34%] min-w-[120px] shrink-0 bg-gray-100">
                  <img
                    src={image}
                    alt={item.property?.title || "Property"}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    aria-label="Remove from shortlist"
                    className="absolute left-2 top-2 grid h-7 w-7 place-items-center cursor-pointer rounded-full bg-white/95 text-red-500 shadow-sm transition hover:bg-white"
                    disabled={removeShortlistMutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeShortlistMutation.mutate(item.property._id);
                    }}
                  >
                    <GoHeartFill className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Share property"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center cursor-pointer rounded-full bg-white/95 text-gray-700 shadow-sm transition hover:bg-white hover:text-[#27AE60]"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      shareProperty(getTitle(item), href);
                    }}
                  >
                    <FiShare2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* CONTENT */}
                <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-none text-gray-950">
                      {formatPrice(item.property)}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                      {getTitle(item)}
                    </h3>

                    <p className="mt-5 truncate text-xs text-gray-500">
                      {location || "Location not specified"}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
                    <p className="min-w-0 truncate text-xs text-gray-700">
                      {area ? `${area.toLocaleString("en-IN")} sqft` : "Area —"}
                      {pricePerSqft
                        ? ` (₹ ${pricePerSqft.toLocaleString("en-IN")}/sqft)`
                        : ""}
                    </p>

                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#27AE60]/10 px-2 py-1 text-[11px] font-semibold text-[#27AE60]">
                      Details
                    </span>
                  </div>
                </div>
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
