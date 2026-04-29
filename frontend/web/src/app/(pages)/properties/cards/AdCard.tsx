"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdClose, MdOpenInNew } from "react-icons/md";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { useShortlist } from "@/hooks/useShortlist";

export interface Ad {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  category?: string;
  featured?: boolean;
  sponsored?: boolean;
  expiryDate?: Date;
  isExpired?: boolean;
}

interface AdCardProps {
  ad: Ad;
  onDismiss?: (adId: string) => void;
}

type ShortlistPropertyType =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural"
  | "FeaturedProject";

function getShortlistPropertyType(
  category?: string,
): ShortlistPropertyType | undefined {
  switch (category?.toLowerCase()) {
    case "residential":
    case "residentials":
      return "Residential";
    case "commercial":
    case "commercials":
      return "Commercial";
    case "land":
    case "landplot":
    case "landplots":
      return "Land";
    case "agricultural":
    case "agriculturals":
      return "Agricultural";
    case "featured":
    case "featuredproject":
    case "featured project":
      return "FeaturedProject";
    default:
      return undefined;
  }
}

const AdCard: React.FC<AdCardProps> = ({ ad, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    ad.id,
    getShortlistPropertyType(ad.category),
  );

  // Check if ad is expired
  useEffect(() => {
    if (ad.expiryDate) {
      const expired = new Date(ad.expiryDate) < new Date();
      setIsExpired(expired || ad.isExpired || false);
    }
  }, [ad.expiryDate, ad.isExpired]);

  if (isExpired) {
    return null;
  }

  const handleToggleShortlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleShortlist();
  };


  return (
    <Link href={ad.ctaLink} target="_blank" rel="noopener noreferrer">
      <div
        className="relative group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-300 h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 300px"
          />

          {/* Sponsored Badge */}
          {ad.sponsored && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-md shadow-md">
              Sponsored
            </div>
          )}

          {/* Category Badge */}
          {ad.category && !ad.sponsored && (
            <div className="absolute top-2 left-2 bg-[#27AE60]/90 text-white text-xs font-semibold px-2 py-1 rounded-md">
              {ad.category}
            </div>
          )}

          {/* Featured Badge */}
          {ad.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500/90 text-white text-xs font-semibold px-2 py-1 rounded-md">
              Featured
            </div>
          )}

          {/* Save/Shortlist Button */}
          <button
            onClick={handleToggleShortlist}
            disabled={isShortlistLoading}
            className="absolute bottom-2 right-2 z-10 rounded-full bg-white/95 p-2 shadow-md transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={
              isShortlisted ? "Remove from shortlist" : "Shortlist property"
            }
            title={isShortlisted ? "Remove from shortlist" : "Shortlist"}
          >
            {isShortlistLoading ? (
              <span className="block h-5 w-5 animate-pulse rounded-full bg-gray-300" />
            ) : isShortlisted ? (
              <GoHeartFill className="h-5 w-5 text-red-500" />
            ) : (
              <GoHeart className="h-5 w-5 text-gray-600 transition-colors group-hover:text-red-500" />
            )}
          </button>
        </div>

        {/* Content Container */}
        <div className="p-3 flex flex-col gap-2 h-[calc(100%-160px)] justify-between">
          {/* Title */}
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 group-hover:text-[#27AE60] transition-colors">
              {ad.title}
            </h3>

            {/* Description */}
            {ad.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                {ad.description}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
            <span className="text-xs font-medium text-[#27AE60]">
              {ad.ctaText}
            </span>
            <MdOpenInNew className="h-4 w-4 text-[#27AE60] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Overlay on Hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/5 pointer-events-none rounded-2xl" />
        )}
      </div>
    </Link>
  );
};

export default AdCard;
