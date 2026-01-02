"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ImageAutoCarouselProps = {
  images: string[];
  alt?: string;
  interval?: number;
  className?: string;
  onIndexChange?: (index: number) => void;
};

const ImageAutoCarousel = ({
  images,
  alt = "property image",
  interval = 3000,
  className = "",
  onIndexChange,
}: ImageAutoCarouselProps) => {
  const safeImages = images.length ? images : ["/placeholder.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  useEffect(() => {
    if (paused || safeImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [paused, safeImages.length, interval]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SLIDER TRACK */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
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
    </div>
  );
};

export default ImageAutoCarousel;
