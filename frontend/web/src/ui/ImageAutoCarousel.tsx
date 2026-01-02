"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { GoHeart, GoHeartFill } from "react-icons/go";

type ImageAutoCarouselProps = {
  images: string[];
  alt?: string;
  interval?: number;
  className?: string;
  onIndexChange?: (index: number) => void;

  /* SHORTLIST */
  isShortlisted?: boolean;
  onToggleShortlist?: () => void;
  isShortlistLoading?: boolean;
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
}: ImageAutoCarouselProps) => {
  const safeImages = images.length ? images : ["/placeholder.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = safeImages.length;

  /* notify parent */
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  /* auto slide */
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
      className={`relative h-full w-full group rounded-md overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SLIDER TRACK */}
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

      {/* ❤️ SHORTLIST ICON */}
      {onToggleShortlist && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleShortlist();
          }}
          className="
            absolute top-2 right-2
            bg-white/90 p-1.5 rounded-full shadow
            transition-all duration-200
            hover:scale-110 active:scale-95
          "
          title={isShortlisted ? "Remove from shortlist" : "Shortlist"}
        >
          {isShortlistLoading ? (
            <span className="w-5 h-5 block animate-pulse bg-gray-300 rounded-full" />
          ) : isShortlisted ? (
            <GoHeartFill className="w-5 h-5 text-red-500" />
          ) : (
            <GoHeart className="w-5 h-5 text-gray-600 hover:text-red-500" />
          )}
        </button>
      )}

      {/* LEFT ARROW */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            prev();
          }}
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            flex h-8 w-8 items-center justify-center
            rounded-full bg-black/30 text-white
            opacity-0 -translate-x-2
            transition-all duration-300 ease-out
            group-hover:opacity-100 group-hover:translate-x-0
            hover:bg-black/50
          "
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* RIGHT ARROW */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            next();
          }}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            flex h-8 w-8 items-center justify-center
            rounded-full bg-black/30 text-white
            opacity-0 translate-x-2
            transition-all duration-300 ease-out
            group-hover:opacity-100 group-hover:translate-x-0
            hover:bg-black/50
          "
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ImageAutoCarousel;
