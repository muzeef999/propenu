"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";

interface Props {
  items?: FeaturedProject[];
}

export default function FeaturedProjectsClient({ items = [] }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);


  const { city, popular, normal, setCity } = useCity();

  const scrollLeft = () =>
    sliderRef.current?.scrollBy({
      left: -window.innerWidth / 2,
      behavior: "smooth",
    });

  const scrollRight = () =>
    sliderRef.current?.scrollBy({
      left: window.innerWidth / 2,
      behavior: "smooth",
    });

  return (
    <div className="relative w-full">
      {/* Left Arrow */}

      <div className="flex justify-between items-center">
        <div className="headingSideBar">
          <h1 className="text-2xl font-bold">Feature Projects</h1>
          <p className="headingDesc">
            Building excellence in {city?.name ?? "Hyderabad"}
          </p>
        </div>
      </div>

      <div
        onClick={scrollLeft}
        aria-label="Scroll left"
        className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-2xl cursor-pointer transition-transform duration-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-90" />
      </div>

      {/* Scrollable Row */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-10 py-4 snap-x snap-mandatory"
      >
        {items.map((project) => (
          <div
            key={project._id}
            className="min-w-full sm:min-w-[48%] md:min-w-[48%] lg:min-w-[48%] xl:min-w-[48%] card snap-start"
          >
            <Link
              href={`/featured/${project.slug}`}
              className="block h-[200px] overflow-hidden rounded-t-md"
            >
              <img
                src={project.heroImage ?? "/images/placeholder.svg"}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </Link>

            <div className="p-3">
              <h2 className="text-md font-medium">{project.title}</h2>
              {project.featuredTagline && (
                <p className="text-gray-600 text-sm">
                  {project.featuredTagline}
                </p>
              )}
              <p>80,000</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <div
        onClick={scrollRight}
        aria-label="Scroll right"
        className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-2xl cursor-pointer transition-transform duration-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-270" />
      </div>
    </div>
  );
}
