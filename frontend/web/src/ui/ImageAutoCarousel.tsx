"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { IoMdShareAlt } from "react-icons/io";

type ImageAutoCarouselProps = {
  images: string[];
  alt?: string;
  interval?: number;
  className?: string;
  onIndexChange?: (index: number) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: () => void;
  isShortlistLoading?: boolean;
  onShare?: () => void;
};

const ImageAutoCarousel = ({
  images,
  alt = "property image",
  interval = 3000,
  className = "",
  onIndexChange,
  isShortlisted,
  onToggleShortlist,
  isShortlistLoading,
  onShare,
}: ImageAutoCarouselProps) => {
  const filteredImages = images.filter(
    (src) => typeof src === "string" && src.trim() !== "",
  );
  const safeImages = filteredImages.length ? filteredImages : ["/placeholder.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = safeImages.length;

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  useEffect(() => {
    if (paused || total <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, interval);

    return () => clearInterval(timer);
  }, [paused, total, interval]);

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <div
      className={`group relative h-full w-full overflow-hidden rounded-md ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {safeImages.map((src, idx) => (
          <div key={idx} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {(onShare || onToggleShortlist) && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onShare();
              }}
              className="cursor-pointer rounded-full bg-white/90 p-1.5 shadow transition-all duration-200 hover:scale-110 active:scale-95"
              title="Share property"
              aria-label="Share property"
            >
              <IoMdShareAlt className="h-5 w-5 text-gray-700" />
            </button>
          )}

          {onToggleShortlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleShortlist();
              }}
              className="cursor-pointer rounded-full bg-white/90 p-1.5 shadow transition-all duration-200 hover:scale-110 active:scale-95"
              title={isShortlisted ? "Remove from shortlist" : "Shortlist"}
              aria-label={isShortlisted ? "Remove from shortlist" : "Shortlist"}
            >
              {isShortlistLoading ? (
                <span className="block h-5 w-5 animate-pulse rounded-full bg-gray-300" />
              ) : isShortlisted ? (
                <GoHeartFill className="h-5 w-5 text-red-500" />
              ) : (
                <GoHeart className="h-5 w-5 text-gray-600 hover:text-red-500" />
              )}
            </button>
          )}
        </div>
      )}

      {total > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            prev();
          }}
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 hover:bg-black/50"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>
      )}

      {total > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            next();
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 hover:bg-black/50"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ImageAutoCarousel;
