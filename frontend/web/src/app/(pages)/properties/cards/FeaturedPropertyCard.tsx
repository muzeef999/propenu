"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BiBuildingHouse } from "react-icons/bi";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import ImageAutoCarousel from "@/ui/ImageAutoCarousel";
import formatINR from "@/utilies/PriceFormat";
import { hexToRGBA } from "@/ui/hexToRGBA";
import {
  AmenitiesIcon,
  SuperBuiitupAraea,
  UnderConstruction,
} from "@/icons/icons";
import { Property } from "@/types/property";
import { useShortlist } from "@/hooks/useShortlist";


export interface IPromotion {
  type: "normal" | "featured" | "sponsored" | "prime";
  priority: number;
  source: "manual" | "subscription";
  startDate?: Date;
  boostExpiry?: Date;
  enquiryLimit?: number;
  enquiriesUsed?: number;
  features?: {
    emailPromotion?: boolean;
    whatsappPromotion?: boolean;
  };
}

function getBhkLabel(property: Property) {
  const bhks = Array.isArray(property.bhkSummary)
    ? property.bhkSummary
        .map((item) => item.bhk)
        .filter((value) => typeof value === "number" && Number.isFinite(value))
    : [];

  if (!bhks.length && Array.isArray(property.bhk)) {
    bhks.push(
      ...property.bhk.filter(
        (value) => typeof value === "number" && Number.isFinite(value),
      ),
    );
  }

  if (!bhks.length) return "Apartments";

  const uniqueBhks = Array.from(new Set(bhks)).sort((a, b) => a - b);
  return `${uniqueBhks.join(", ")} BHK`;
}

function getPriceLabel(property: Property) {
  const from = property.priceFrom ?? property.price;
  const to = property.priceTo;

  if (typeof from === "number" && typeof to === "number" && to > from) {
    return `${formatINR(from)} - ${formatINR(to)}`;
  }

  if (typeof from === "number") {
    return `From ${formatINR(from)}`;
  }

  return "Price on request";
}

function getAmenitiesCount(property: Property) {
  if (Array.isArray(property.amenities)) {
    return property.amenities.length;
  }

  if (
    typeof property.amenitiesCount === "number" &&
    Number.isFinite(property.amenitiesCount)
  ) {
    return property.amenitiesCount;
  }

  return 0;
}

function getProjectAreaLabel(property: Property) {
  if (
    typeof property.projectArea === "number" &&
    Number.isFinite(property.projectArea) &&
    property.projectArea > 0
  ) {
    return `${property.projectArea} Acre`;
  }

  return "Area on request";
}

function getFeaturedProjectHref(property: Property) {
  return property.promotion?.type === "prime"
    ? `/prime/${property.slug}`
    : `/project/${property.slug}`;
}



const FeaturedPropertyCard: React.FC<{ p: Property; vertical?: boolean }> = ({
  p,
  vertical = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);
  const bgPriceColorIcon = hexToRGBA("#27AE60", 0.4);
  const images =
    p.gallery?.map((item) => item.url) ??
    p.gallerySummary?.map((item) => item.url) ??
    [];
  const amenitiesCount = getAmenitiesCount(p);
  const projectId = p.id || p._id;
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    projectId,
    "FeaturedProject",
  );

  const promotionType = p?.promotion?.type || "normal";

  const promotionConfig: Partial<
    Record<IPromotion["type"], { label: string; className: string }>
  > = {
    sponsored: {
      label: "Sponsored",
      className: "bg-black/50",
    },
    featured: {
      label: "Featured",
      className: "bg-black/50",
    },
    prime: {
      label: "Prime Project",
      className: "bg-black/50",
    },
  };
  const promotionBadge = promotionConfig[promotionType];
  const propertyHref = getFeaturedProjectHref(p);



  return (
    <div
      className={`card p-2 h-auto flex overflow-hidden ${
        vertical
          ? "w-[min(100vw-2rem,360px)] flex-col"
          : "flex-col md:flex-row md:h-[220px]"
      }`}
    >
      <Link
        href={propertyHref}
        className={`flex flex-1 min-w-0 ${
          vertical ? "flex-col" : "flex-col md:flex-row"
        }`}
      >
        <div
          className={`rounded-xl relative shrink-0 ${
            vertical ? "w-full h-48" : "w-full h-48 md:w-56 md:h-full"
          }`}
        >
          <ImageAutoCarousel
            images={images}
            alt={p.title}
            onIndexChange={setActiveImageIndex}
            isShortlisted={isShortlisted}
            isShortlistLoading={isShortlistLoading}
            onToggleShortlist={toggleShortlist}
          />

          {promotionBadge && (
            <div
              className={`absolute left-2 top-2 rounded-md px-2 py-1 text-xs text-white ${promotionBadge.className}`}
            >
              {promotionBadge.label}
            </div>
          )}

          <div className="absolute left-2 bottom-2 flex items-center gap-2 text-xs text-white">
            <div className="bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
              <span>
                {activeImageIndex + 1}/{images.length || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 p-4 md:p-4 flex flex-col justify-between h-auto md:h-full">
          <div
            className={`min-w-0 flex ${vertical ? "flex-col gap-1" : "flex-col"}`}
          >
            <h3
              className={`font-semibold leading-snug line-clamp-2 ${
                vertical
                  ? "text-base max-w-[250px] truncate"
                  : "text-lg md:text-md max-w-[600px]"
              }`}
            >
              {p.title} {p.propertyType} for Sale in{" "}
              {[p.locality, p.city].filter(Boolean).join(", ")}
            </h3>

            <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-gray-500">
              <BiBuildingHouse className="h-4 w-4 shrink-0" />
              <span className="block min-w-0 truncate">{p?.buildingName}</span>
            </p>
          </div>

          <div
            className={`hidden ${vertical ? "" : "md:flex"} flex-wrap gap-2 mt-3`}
          >
            <span className="text-xs font-normal px-2 py-1 text-primary">
              RERA Approved
            </span>
            <span className="text-xs font-normal px-2 py-1 text-primary">
              New Launch
            </span>
            <span className="text-xs font-normal px-2 py-1 text-primary">
              Builder Project
            </span>
          </div>

          <div
            className={`mt-4 text-xs text-gray-600 border-t pt-4 border-gray-200 ${
              vertical
                ? "grid grid-cols-2 gap-4"
                : "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6"
            }`}
          >
            <div className="items-center gap-2 flex">
              <AmenitiesIcon className="h-7 w-7 shrink-0 text-[#27AE60]" />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">
                  Amenities
                </div>
                <div className="font-medium">
                  {amenitiesCount}{" "}
                  {amenitiesCount === 1 ? "Amenity" : "Amenities"}
                </div>
              </div>
            </div>

            <div className="items-center gap-2 flex">
              <SuperBuiitupAraea size={24} color={bgPriceColorIcon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">Area</div>
                <div className="font-medium">{getProjectAreaLabel(p)}</div>
              </div>
            </div>

            <div className="items-center gap-2 flex">
              <UnderConstruction size={24} color={bgPriceColorIcon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">
                  Availability
                </div>
                <div className="font-medium">Available</div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <aside
        className={`rounded-xl ${
          vertical
            ? "w-full px-3 py-2 flex items-center justify-between gap-3"
            : "w-full mt-3 px-3 py-2 flex items-center justify-between gap-3 md:w-60 md:p-3 md:flex-col md:justify-center md:mt-0"
        }`}
        style={{ backgroundColor: bgPriceColor }}
      >
        <div
          className={`${
            vertical
              ? "flex flex-col"
              : "flex flex-col md:items-center md:text-center"
          }`}
        >
          <div
            className={`whitespace-nowrap text-green-700 font-semibold ${
              vertical
                ? "text-lg leading-tight"
                : "text-lg leading-tight md:text-xl lg:text-2xl"
            }`}
          >
            {getPriceLabel(p)}
          </div>
        </div>

        <div
          className={`${
            vertical
              ? "shrink-0"
              : "shrink-0 md:w-full md:mt-4 flex justify-center"
          }`}
        >
          <ContactOwnerButton
            projectId={projectId}
            propertyType="featuredprojects"
            listingType="sale"
            listingSource="builder"
            postedOn={p.createdAt}
            price={p.priceFrom ?? p.price}
            propertyLabel={p.title}
            className={`btn-primary text-white rounded-md shadow-sm transition font-medium whitespace-nowrap ${
              vertical
                ? "px-4 py-1.5 text-sm"
                : "px-4 py-1.5 text-sm md:w-[90%] md:py-2 md:text-base"
            }`}
          >
            Contact Builder
          </ContactOwnerButton>
        </div>
      </aside>
    </div>
  );
};

export default FeaturedPropertyCard;
