"use client";

import React, { useState } from "react";
import {
  Facing,
  RoadAccessIcon,
  SuperBuiitupAraea,
  UnderConstruction,
} from "@/icons/icons";
import { Property } from "@/types/property";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import Link from "next/link";
import { AiOutlineHeart } from "react-icons/ai";
import { BiBuildingHouse } from "react-icons/bi";
import { ILand } from "@/types/land";
import ImageAutoCarousel from "@/ui/ImageAutoCarousel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { me, postLeads, postShortlistProperty } from "@/data/ClientData";
import { toast } from "sonner";

export const LandCard: React.FC<{ p: ILand; vertical?: boolean }> = ({
  p,
  vertical = false,
}) => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);

  const bgPriceColoricon = hexToRGBA("#27AE60", 0.4);

  const img = p?.gallery?.[0]?.url ?? "/placeholder.jpg";
  const area = (p as any)?.superBuiltUpArea;
  const pricePerSqft =
    (p as any)?.pricePerSqft ?? (area ? Math.round((p?.price ?? 0) / area) : 0);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShortlisted, setIsShortlisted] = useState<boolean>(
    Boolean((p as any)?.isShortlisted)
  );

  const { mutate: shortlistProperty, isPending: isShortlisting } = useMutation({
    mutationFn: postShortlistProperty,
    onSuccess: () => {
      toast.success(
        !isShortlisted ? "Property shortlisted!" : "Removed from shortlist"
      );
    },
    onError: () => {
      setIsShortlisted((prev) => !prev); // rollback
      toast.error("Failed to update shortlist");
    },
  });
  const {data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });
  const user = userData?.user;
  const {mutate: postLead, isPending: isLeadPosting } = useMutation({
    mutationFn: postLeads,
    onSuccess: () => {
      toast.success("Owner will contact you shortly");
    },
    onError: () => {
      toast.error("Failed to contact owner");
    },
  });

  return (
    <Link
      href={`/properties/land/${p.slug}`}
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
            if (!p.id) {
              toast.error(
                "Failed to update shortlist: Property ID is missing."
              );
              return;
            }
            setIsShortlisted((prev) => !prev);

            shortlistProperty({
              propertyId: p.id ?? p._id,
              propertyType: "Land",
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
          <h3 className="text-lg md:text-md font-semibold truncate max-w-[460px]">
            {p.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 truncate">
            <BiBuildingHouse className="w-4 h-4" />
            {/* {vertical ? (p as any)?.buildingName?.slice(0, 18)?.concat("...") : (p as any)?.buildingName} */}
            {(p as any)?.landName}
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
                Plot Area
              </div>
              <div className="font-medium">
                {(p as any)?.plotArea ?? "—"} sqft
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <UnderConstruction size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Dimensions
              </div>

              <div className="font-medium">
                {(p as any)?.dimensions?.length && (p as any)?.dimensions?.width
                  ? `${(p as any).dimensions.length} x ${
                      (p as any).dimensions.width
                    }`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <Facing size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">Facing</div>
              <div className="font-medium">
                {(p as any)?.facing?.trim() ?? "—"}
              </div>
            </div>
          </div>

          <div className="items-center gap-2 flex">
            <RoadAccessIcon size={24} color={bgPriceColoricon} />
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 tracking-wide">
                Road Width
              </div>
              <div className="font-medium">
                {(p as any)?.roadWidthFt
                  ? `${(p as any)?.roadWidthFt} Feet`
                  : "—"}
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

          <div className="text-xs text-gray-600">₹ {pricePerSqft}/sqft</div>
        </div>

        {/* BUTTON */}
        <div
          className={`${
            vertical
              ? "shrink-0"
              : "shrink-0 md:w-full md:mt-4 justify-center flex"
          }`}
        >
           <button
            disabled={isLeadPosting}
            className={`bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition font-medium whitespace-nowrap ${
              vertical
                ? "px-4 py-1.5 text-sm"
                : "px-4 py-1.5 text-sm md:w-[90%] md:py-2 md:text-base "
            }`}
            onClick={(e) => {
              e.preventDefault(); // 🚫 stop navigation

              postLead({
                name: user?.name || "Guest User",
                phone: user?.phone || "7993371356",
                email: user?.email || "",
                projectId: p.id,
                propertyType: "residential", // backend enum
                remarks: `Interested in ${p.title}`,
              });
            }}
          >
            {isLeadPosting ? "Sending..." : "Contact Owner"}
          </button>
        </div>
      </aside>
    </Link>
  );
};
