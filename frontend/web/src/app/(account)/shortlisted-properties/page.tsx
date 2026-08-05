"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ActiveTabs from "@/ui/ActiveTabs";
import { getUserShortlist, removeShortlistProperty } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import { GoHeartFill } from "react-icons/go";
import formatINR from "@/utilies/PriceFormat";
import { IoIosShareAlt } from "react-icons/io";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PAGE_SIZE = 6;

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
  projectArea?: number;
  sqftRange?: { min?: number; max?: number };
  projectSummary?: ProjectSummaryItem[];
  bhkSummary?: ProjectSummaryItem[];
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

type ProjectSummaryItem = {
  units?: {
    minSqft?: number;
    area?: {
      value?: number;
      sqftValue?: number;
    };
  }[];
};
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
    property?.carpetArea ??
    property?.builtUpArea ??
    property?.plotArea ??
    property?.sqftRange?.min;

  if (explicitArea) return explicitArea;

  const projectUnitAreas = (property?.projectSummary ?? property?.bhkSummary ?? [])
    .flatMap((item) => item.units ?? [])
    .map((unit) => unit.area?.sqftValue ?? unit.minSqft ?? unit.area?.value)
    .filter((area): area is number => typeof area === "number" && Number.isFinite(area) && area > 0);

  if (projectUnitAreas.length > 0) {
    return Math.min(...projectUnitAreas);
  }

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
  const [page, setPage] = useState(1);
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

  const filteredProperties = useMemo(
    () =>
      shortlisted.filter(
        (item) => normalizeType(item.propertyType) === normalizeType(activeTab),
      ),
    [activeTab, shortlisted],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredProperties.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProperties]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };
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
        setActiveTab={handleTabChange}
        shouldShowCategory={shouldShowCategory}
      />

      {/* CARDS */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredProperties.length ? (
            paginatedProperties.map((item) => {
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
                  .join(", ") || item.property?.address;

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
                      <IoIosShareAlt className="h-3.5 w-3.5" />
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

        {filteredProperties.length > PAGE_SIZE ? (
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredProperties.length}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </div>
  );
};

function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = totalItems ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalItems);
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
  );
  const pageItems = visiblePages.reduce<Array<number | "dots">>(
    (items, item) => {
      const previous = items[items.length - 1];

      if (typeof previous === "number" && item - previous > 1) {
        items.push("dots");
      }

      items.push(item);
      return items;
    },
    [],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
        properties
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageItems.map((item, index) =>
            item === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-9 w-7 items-center justify-center text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-9 min-w-9 rounded-md px-3 text-sm font-medium transition ${
                  page === item
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label="Next page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Page;
