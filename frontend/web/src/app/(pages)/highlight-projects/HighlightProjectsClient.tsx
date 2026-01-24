"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";
import formatINR from "@/utilies/PriceFormat";
import { RiArrowRightSLine } from "react-icons/ri";

interface Props {
  items?: FeaturedProject[];
}

export default function HighlightProjectsClient({ items = [] }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { selectedCity } = useCity();

  const scrollLeft = () =>
    sliderRef.current?.scrollBy({
      left: -320,
      behavior: "smooth",
    });

  const scrollRight = () =>
    sliderRef.current?.scrollBy({
      left: 320,
      behavior: "smooth",
    });

  return (
    <div className="relative w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">

        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Highlight Projects
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Popular projects in {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
        <Link
          href="/featured"
          aria-label="View all featured properties"
          className="shrink-0 flex items-center gap-1 text-sm sm:text-base text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
        >
          View All <RiArrowRightSLine size={18} />
        </Link>
      </div>

      {/* Navigation Buttons */}
      {/* Left button */}
      <button
        onClick={scrollLeft}
        aria-label="Scroll left"
        className="hidden md:flex absolute left-2 lg:-left-3 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-90" />
      </button>

      {/* Right button */}
      <button
        onClick={scrollRight}
        aria-label="Scroll right"
        className=" hidden md:flex absolute right-2 lg:-right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-270" />
      </button>



      {/* Scrollable Container */}
      <div
        ref={sliderRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-6 snap-x snap-mandatory px-1"
      >
        {items.map((project) => (
          <Link
            key={project._id}
            href={`/featured/${project.slug}`}
            className="relative shrink-0 snap-start group cursor-pointer transition-all duration-300 hover:-translate-y-2 w-[260px] sm:w-[280px] md:w-[320px]"
          >
            {/* IMAGE box */}
            <div
              className="mt-5 w-full overflow-hidden rounded-2xl h-[150px] sm:h-[170px] md:h-[180px] shadow-sm transition-shadow duration-300 group-hover:shadow-2xl"
            >
              <img
                src={project.heroImage ?? "/images/placeholder.svg"}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* INFO CARD FLOATING */}
            <div
              className="absolute left-3 right-3 top-[130px] sm:top-[140px] md:top-[150px] bg-white rounded-xl p-3 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
              {/* Row 1 */}
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                  {project.title}
                </h2>

                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {project.priceFrom ? formatINR(project.priceFrom) : "—"}
                </span>
              </div>

              {/* Row 2 */}
              <p className="text-xs text-gray-500 truncate font-medium">
                {project.address ?? "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
