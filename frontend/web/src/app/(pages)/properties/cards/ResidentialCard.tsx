"use client";

import React from "react";
import { Property } from "@/types/property";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { AiOutlineHeart } from "react-icons/ai";
import {
  Furnishing,
  Parking,
  SuperBuiitupAraea,
  UnderConstruction,
} from "@/icons/icons";
import formatINR from "@/utilies/PriceFormat";
import Link from "next/link";

const ResidentialCard: React.FC<{ p: Property }> = ({ p }) => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);

  const bgPriceColoricon = hexToRGBA("#27AE60", 0.4);

  const img = p?.gallery?.[0]?.url ?? "/placeholder-property.jpg";
  const pricePerSqft =
    (p as any)?.pricePerSqft ??
    Math.round((p?.price ?? 0) / (p as any)?.superBuiltUpArea || 0);

  return (
    <Link href={`/properties/residential/${p.slug}`} className="card p-2 h-auto md:h-[220px] flex flex-col md:flex-row overflow-hidden">
      {/* Left: image */}
      <div className="w-full h-48 md:h-auto md:w-56 lg:w-65 rounded-xl relative shrink-0">
        <img
          src={img}
          alt={p?.title ?? "property image"}
          className="h-full w-full object-cover  rounded-xl"
          loading="lazy"
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
            <span>{p?.gallery?.length ?? 1}</span>
          </div>
        </div>

        {/* favourite icon */}
        <button
          aria-label="favorite"
          className="absolute right-2 top-2 bg-white/90 p-1 rounded-full shadow-sm"
          title="Save"
        >
          <AiOutlineHeart className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Middle: content */}
      <div className="flex-1 p-4 md:p-4 flex flex-col justify-between h-auto md:h-full">
        <div>
          <h3 className="text-lg md:text-xl font-semibold line-clamp-2">
            {p?.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            {(p as any)?.buildingName}, {p?.city}
          </p>
        </div>

        {/* badges */}
        <div className="hidden md:flex flex-wrap gap-2 mt-3">
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
        <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-6 mt-4 text-sm text-gray-600">
          <div className="items-center gap-2">
            <SuperBuiitupAraea size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              Super Built-up Area
            </div>
            <div className="tex-black font-medium">
              {(p as any)?.superBuiltUpArea ?? "—"} sqft
            </div>
          </div>

          <div className="items-center gap-2">
            <UnderConstruction size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              Under Construction
            </div>
            <div className="font-medium">
              {(p as any)?.constructionStatus ?? "—"}
            </div>
          </div>

          <div className="items-center gap-2">
            <Furnishing size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              Furnishing
            </div>
            <div className="font-medium">
              {(p as any)?.furnishing?.trim() ?? "—"}
            </div>
          </div>

          <div className="items-center gap-2">
            <Parking size={24} color={bgPriceColoricon} />
            <div className="text-xs">Parking</div>
            <div className="font-medium">
              {(p as any)?.parkingType?.trim() ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Right: price card */}
      <aside
        className="w-full md:w-52 p-3 md:p-4 flex flex-row md:flex-col justify-between items-center md:justify-center rounded-b-xl md:rounded-l-none md:rounded-r-xl shrink-0"
        style={{ backgroundColor: bgPriceColor }}
      >
        <div className="flex flex-col md:items-center md:text-center">
          <div className="text-green-700 font-bold text-xl md:text-2xl">
            {formatINR(p?.price)}
          </div>
          <div className="text-xs md:text-sm text-gray-600">
            ₹ {pricePerSqft}/sqft
          </div>
        </div>

        <div className="w-auto md:w-full md:mt-4">
          <button
            className="px-4 md:px-0 w-full bg-green-600 text-white text-sm md:text-base py-2 md:py-2 rounded-md shadow-sm hover:bg-green-700 transition font-medium whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault(); // Prevent Link navigation when clicking button
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

export default ResidentialCard;
