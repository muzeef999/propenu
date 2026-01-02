"use client";

import React, { useState } from "react";
import {
  RoadAccessIcon,
  SoilTypeIcon,
  SuperBuiitupAraea,
  WaterTypeIcon,
} from "@/icons/icons";
import { Property } from "@/types/property";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import Link from "next/link";
import { AiOutlineHeart } from "react-icons/ai";
import { BiBuildingHouse } from "react-icons/bi";
import { IAgricultural } from "@/types/agricultural";
import ImageAutoCarousel from "@/ui/ImageAutoCarousel";
import { toast } from "sonner";
import { postShortlistProperty } from "@/data/ClientData";
import { useMutation } from "@tanstack/react-query";

const AgriculturalCard: React.FC<{ p: IAgricultural; vertical?: boolean }> = ({
  p,
  vertical = false,
}) => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);
  const bgPriceColoricon = hexToRGBA("#27AE60", 0.4);

  const img = p?.gallery?.[0]?.url ?? "/placeholder.jpg";
  const pricePerSqft =
    (p as any)?.pricePerSqft ??
    Math.round((p?.price ?? 0) / (p as any)?.builtUpArea || 0);
      const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isShortlisted, setIsShortlisted] = useState<boolean>(
      Boolean((p as any)?.isShortlisted)
    );
    const{ mutate: shortlistProperty, isPending: isShortlisting } = useMutation({
      mutationFn: postShortlistProperty,
      onSuccess: () => {
        toast.success(
          isShortlisted ? "Property shortlisted!" : "Removed from shortlist"
        );
      },
      onError: () => {
        setIsShortlisted((prev) => !prev); // rollback
        toast.error("Failed to update shortlist");
      },
    })
    

  return (
    <Link
      href={`/properties/agricultural/${p.slug}`}
      className={`card p-2 h-auto flex overflow-hidden ${
        vertical ? "flex-col" : "flex-col md:flex-row md:h-[220px]"
      }`}
    >
      {/* Left: image */}
      <div
        className={`rounded-xl relative shrink-0 ${
          vertical ? "w-full h-48" : "w-full h-48 md:w-56 md:h-full"
        }`}
      >
        <ImageAutoCarousel
          images={p?.gallery?.map((g) => g.url) ?? []}
          alt={p?.title}
          onIndexChange={setActiveImageIndex}
          isShortlisted={isShortlisted}
          isShortlistLoading={isShortlisting}
          onToggleShortlist={() => {
            if (!p._id) {
              toast.error("Property ID is missing, cannot update shortlist.");
              return;
            }
            // optimistic UI
            setIsShortlisted((prev) => !prev);

            shortlistProperty({
              propertyId: p._id,
              propertyType: "Agricultural",
            });
          }}
        />
        {/* overlay: image count & date */}
        <div className="absolute left-2 bottom-2 flex items-center gap-2 text-xs text-white">
          <div className="bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 7h18M3 12h18M3 17h18"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {activeImageIndex + 1}/{p?.gallery?.length ?? 1}
            </span>{" "}
          </div>
        </div>
      </div>

      {/* Middle: content */}
      <div className="flex-1 p-4 md:p-4 flex flex-col justify-between h-auto md:h-full">
        <div>
          {/* <h3 className="text-lg md:text-md font-semibold line-clamp-2">
            {vertical ? `${p?.title?.slice(0, 18)}...` : p?.title}
          </h3> */}
          <h3 className="text-lg md:text-md font-semibold truncate max-w-[460px]">
            {
              p.title
            }
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 truncate">
            <BiBuildingHouse className="w-4 h-4" />
            <span className="capitalize">
              {(p as any)?.landName}
            </span>
          </p>
        </div>

        {/* badges */}
        <div
          className={`hidden ${vertical ? "" : "md:flex"} flex-wrap gap-2 mt-3`}
        >
          <span className="text-xs font-normal px-2 py-1 text-primary">
            RERA Approved
          </span>
          <span className="text-xs font-normal px-2 py-1 text-primary">
            Premium
          </span>
          <span className="text-xs font-normal px-2 py-1 text-primary">
            Zero Brokerage
          </span>
        </div>

        {/* meta icons row */}
        <div
          className={`mt-4 text-xs text-gray-600 ${
            vertical
              ? "grid grid-cols-2 gap-4"
              : "md:flex md:items-center md:gap-6"
          }`}
        >
          <div className="items-center gap-2 flex">
            <SuperBuiitupAraea size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Total Area
              </div>

              <div className="font-medium">
                {(p as any)?.totalArea?.value
                  ? `${(p as any).totalArea.value} ${(p as any).totalArea.unit}`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <WaterTypeIcon size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Water Source
              </div>
              <div className="font-medium">
                {(p as any)?.waterSource ?? "—"}
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <SoilTypeIcon size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Soil Type
              </div>
              <div className="font-medium">
                {(p as any)?.soilType?.trim() ?? "—"}
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <RoadAccessIcon size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Road Access
              </div>
              <div className="font-medium">
                {(p as any)?.accessRoadType?.trim() ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: price card */}
      <aside
        className={`rounded-xl ${
          vertical
            ? "w-full px-3 py-2 flex items-center justify-between gap-3"
            : "w-full mt-3 px-3 py-2 flex items-center justify-between gap-3 md:w-52 md:p-3 md:flex-col md:justify-center md:mt-0"
        }`}
        style={{ backgroundColor: bgPriceColor }}
      >
        {/* PRICE */}
        <div
          className={`${
            vertical
              ? "flex flex-col"
              : "flex flex-col md:items-center md:text-center"
          }`}
        >
          <div
            className={`text-green-700 font-semibold ${
              vertical
                ? "text-lg leading-tight"
                : "text-lg leading-tight md:text-2xl"
            }`}
          >
            {formatINR(p?.price)}
          </div>

          <div className="text-xs text-gray-600">
            ₹ {(p as any)?.pricePerSqft}/sqft
          </div>
        </div>

        {/* BUTTON */}
        <div
          className={`${
            vertical
              ? "shrink-0"
              : "shrink-0 md:w-full md:mt-4 flex justify-center"
          }`}
        >
          <button
            className={`bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition font-medium whitespace-nowrap ${
              vertical
                ? "px-4 py-1.5 text-sm"
                : "px-4 py-1.5 text-sm md:w-[90%] md:py-2 md:text-base"
            }`}
            onClick={(e) => {
              e.preventDefault();
              window.alert(`Contact owner for ${p?.title}`);
            }}
          >
            Contact Owner
          </button>
        </div>
      </aside>
    </Link>
  );
};

export default AgriculturalCard;
