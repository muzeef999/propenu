"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FiMail, FiPhone } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";

import { getMyContactedProperties } from "@/data/ClientData";
import ActiveTabs from "@/ui/ActiveTabs";
import formatINR from "@/utilies/PriceFormat";
import { IoIosShareAlt } from "react-icons/io";

const PROPERTY_TYPE_ROUTE_MAP: Record<string, string> = {
  residential: "residential",
  residentials: "residential",
  commercial: "commercial",
  commercials: "commercial",
  land: "land",
  plot: "land",
  landplots: "land",
  agricultural: "agricultural",
  agriculturals: "agricultural",
  featuredproject: "featured",
  featuredprojects: "featured",
  project: "featured",
  projects: "featured",
};

const PROPERTY_TYPE_TAB_MAP: Record<string, string> = {
  Residential: "residential",
  Commercial: "commercial",
  Plot: "land",
  Agricultural: "agricultural",
  Project: "featured",
};

const normalizePropertyType = (type?: string) => {
  if (!type) return "";

  const normalized = type.toLowerCase().trim();

  return PROPERTY_TYPE_ROUTE_MAP[normalized] ?? normalized;
};

const getPropertyImage = (property: any) => {
  if (typeof property.heroImage === "string" && property.heroImage) {
    return property.heroImage;
  }

  if (Array.isArray(property.gallerySummary) && property.gallerySummary[0]?.url) {
    return property.gallerySummary[0].url;
  }

  if (Array.isArray(property.gallery) && property.gallery[0]?.url) {
    return property.gallery[0].url;
  }

  if (typeof property.gallery === "string" && property.gallery) {
    return property.gallery;
  }

  return "/placeholder.jpg";
};

const getPriceLabel = (property: any) => {
  const price = Number(property.price);
  const priceFrom = Number(property.priceFrom);
  const priceTo = Number(property.priceTo);

  if (Number.isFinite(price) && price > 0) {
    return formatINR(price);
  }

  if (
    Number.isFinite(priceFrom) &&
    priceFrom > 0 &&
    Number.isFinite(priceTo) &&
    priceTo > 0 &&
    priceFrom !== priceTo
  ) {
    return `${formatINR(priceFrom)} - ${formatINR(priceTo)}`;
  }

  if (Number.isFinite(priceFrom) && priceFrom > 0) {
    return `From ${formatINR(priceFrom)}`;
  }

  if (Number.isFinite(priceTo) && priceTo > 0) {
    return `Up to ${formatINR(priceTo)}`;
  }

  return "Price on request";
};

const getDetailHref = (property: any) => {
  if (!property.slug) return null;

  const propertyRoute = normalizePropertyType(property.propertyType);

  if (propertyRoute === "featured") {
    return property.promotion?.type === "prime"
      ? `/prime/${property.slug}`
      : `/project/${property.slug}`;
  }

  if (!propertyRoute) return null;

  return `/properties/${propertyRoute}/${property.slug}`;
};

const shareProperty = async (title: string, href: string) => {
  const url = `${window.location.origin}${href}`;

  if (navigator.share) {
    await navigator.share({ title, url });
    return;
  }

  await navigator.clipboard?.writeText(url);
};

const Page = () => {
  const [activeTab, setActiveTab] = useState("Residential");
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["contactedProperties"],
    queryFn: getMyContactedProperties,
  });

  const properties = data?.properties ?? [];
  const categories = [
    "Residential",
    "Commercial",
    "Plot",
    "Agricultural",
    "Project",
  ];

  const filteredProperties = useMemo(() => {
    const activeType = PROPERTY_TYPE_TAB_MAP[activeTab];

    return properties.filter(
      (property: any) =>
        normalizePropertyType(property.propertyType) === activeType,
    );
  }, [activeTab, properties]);

  const shouldShowCategory = useCallback(
    (category: string) => {
      const categoryType = PROPERTY_TYPE_TAB_MAP[category];

      return properties.some(
        (property: any) =>
          normalizePropertyType(property.propertyType) === categoryType,
      );
    },
    [properties],
  );

  if (isLoading) {
    return <p className="p-6 text-center text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Contacted Properties
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Revisit the properties you contacted and quickly jump back into the
          listings that matter most.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-auto">
          <ActiveTabs
            categories={categories}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            shouldShowCategory={shouldShowCategory}
          />
        </div>

        <p className="shrink-0 text-sm text-gray-500">
          Properties you have contacted ({properties.length})
        </p>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          No contacted properties found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredProperties.map((property: any) => {
            const location =
              property.locality || property.city
                ? `${property.locality || ""}${
                    property.locality && property.city ? ", " : ""
                  }${property.city || ""}`
                : "Location unavailable";
            const detailHref = getDetailHref(property);

            return (
              <article
                key={property.leadId}
                role={detailHref ? "link" : undefined}
                tabIndex={detailHref ? 0 : undefined}
                onClick={() => {
                  if (detailHref) router.push(detailHref);
                }}
                onKeyDown={(event) => {
                  if (!detailHref) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(detailHref);
                  }
                }}
                className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  detailHref ? "cursor-pointer" : ""
                }`}
              >
                <div className="flex min-h-[145px]">
                  <div className="relative w-[34%] min-w-[120px] bg-gray-100">
                    <Image
                      src={getPropertyImage(property)}
                      alt={property.title || "Property"}
                      fill
                      sizes="(max-width: 768px) 40vw, 240px"
                      className="object-cover"
                    />

                    <span className="absolute left-2 top-2 rounded bg-[#26ad5f] px-2 py-0.5 text-[11px] font-medium text-white">
                      {property.listingType === "rent" ? "Rent" : "Sale"}
                    </span>

                    {/* {contactedOn ? (
                      <span className="absolute left-2 top-8 rounded bg-black/50 px-2 py-1 text-[10px] font-medium text-white">
                        {contactedOn}
                      </span>
                    ) : null} */}

                    {detailHref ? (
                      <button
                        type="button"
                        aria-label={`Share ${property.title || "property"}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          shareProperty(property.title || "Property", detailHref);
                        }}
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-gray-700 shadow-sm transition hover:bg-white hover:text-[#27AE60]"
                      >
                        <IoIosShareAlt className="h-3.5 w-3.5" />
                      </button>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 bg-black/30 px-3 py-2 backdrop-blur-[1px]">
                      <p className="min-w-0 truncate text-xl font-semibold leading-none text-white drop-shadow md:text-lg">
                        {getPriceLabel(property)}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-gray-900">
                        {property.title}
                      </h3>

                      <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-gray-500">
                        <HiOutlineLocationMarker className="h-4 w-4 shrink-0" />
                        <span className="truncate">{location}</span>
                      </p>
                    </div>

                    <div className="mt-2 rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-xs font-semibold text-gray-900">
                          {property.owner?.name || "Property owner"}
                        </p>

                        
                      </div>

                      <div className="mt-2 grid gap-1.5 text-xs text-gray-700 sm:grid-cols-2">
                        <a
                          href={
                            property.owner?.phone
                              ? `tel:${property.owner.phone}`
                              : undefined
                          }
                          onClick={(event) => event.stopPropagation()}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <FiPhone className="h-3.5 w-3.5 shrink-0 text-[#27AE60]" />
                          <span className="truncate">
                            {property.owner?.phone || "Phone unavailable"}
                          </span>
                        </a>

                        <a
                          href={
                            property.owner?.email
                              ? `mailto:${property.owner.email}`
                              : undefined
                          }
                          onClick={(event) => event.stopPropagation()}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <FiMail className="h-3.5 w-3.5 shrink-0 text-[#27AE60]" />
                          <span className="truncate">
                            {property.owner?.email || "Email unavailable"}
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Page;
