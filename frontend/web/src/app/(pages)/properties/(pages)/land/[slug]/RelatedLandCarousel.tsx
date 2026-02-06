"use client";

import { useRef } from "react";
import { ILand } from "@/types/land";
import { LandCard } from "../../../cards/LandCard";
import { ArrowDropdownIcon } from "@/icons/icons";

interface RelatedLandCarouselProps {
  projects: ILand[];
}

const RelatedLandCarousel = ({ projects }: RelatedLandCarouselProps) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const step = Math.floor(el.clientWidth / 2);
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy("left")}
        className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-90" />
      </button>
      <div
        ref={sliderRef}
        className="flex gap-4 h-[485px] overflow-x-auto scroll-smooth no-scrollbar px-1 py-2 snap-x snap-mandatory scroll-px-1 w-full"
      >
        {projects.map((relatedProject) => (
          <div key={relatedProject._id} className="lg:snap-start snap-center shrink-0">
            <LandCard p={relatedProject} vertical={true} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy("right")}
        className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-270" />
      </button>
    </div>
  );
};

export default RelatedLandCarousel;