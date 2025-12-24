"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";
import Image from "next/image";
import formatINR from "@/utilies/PriceFormat";

interface Props {
  items?: FeaturedProject[];
}

export default function FeaturedProjectsClient({ items = [] }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const { selectedCity } = useCity();

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
          <h1 className="text-2xl font-bold">Prime Properties</h1>
          <p className="headingDesc">
            Exceptional  properties {selectedCity?.city ?? "Hyderabad"}
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
        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-1 py-4 snap-x snap-mandatory"
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

            <div className="p-3 flex justify-between items-center gap-4">
              {/* Logo */}
              <div className="shrink-0">
                <Image
                  src={project?.logo?.url ?? "/images/placeholder.svg"}
                  alt={project.title}
                  width={80}
                  height={80}
                  className="object-cover rounded-md"
                />
              </div>

              {/* Title + Address */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-medium text-left">
                  {project.title}
                </h2>

                {project.address && (
                  <p className="text-[#676666] text-base mt-1">
                    {project.address}
                  </p>
                )}
              </div>

              {/* BHK, Price, Button */}
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-[#676666] font-light text-base">
                  2,3 BHK Flats
                </p>

                <p className="text-black text-base">
                  {formatINR(project?.priceFrom)}
                  <span className="text-[#676666] font-light text-sm">
                    {" "}
                    onwards
                  </span>
                </p>
              </div>
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
