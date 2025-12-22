"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";
import formatINR from "@/utilies/PriceFormat";

interface Props {
    items?: FeaturedProject[];
}

export default function HighlightProjectsClient({ items = [] }: Props) {
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const { city } = useCity();

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
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="headingSideBar">
                    <h1 className="text-2xl font-bold">Highlight Projects</h1>
                    <p className="headingDesc">Explore properties across locations</p>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div
                onClick={scrollLeft}
                aria-label="Scroll left"
                className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
            >
                <ArrowDropdownIcon size={16} className="rotate-90" />
            </div>

            <div
                onClick={scrollRight}
                aria-label="Scroll right"
                className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
            >
                <ArrowDropdownIcon size={16} className="rotate-270" />
            </div>

            {/* Scrollable Container */}
            <div
                ref={sliderRef}
                className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-6 snap-x snap-mandatory"
            >
                {items.map((project) => (
                    <Link
                        key={project._id}
                        href={`/featured/${project.slug}`}
                        className="relative shrink-0 w-[320px] h-[260px] snap-start cursor-pointer group transition-all duration-300 hover:-translate-y-[7px]"
                    >
                        {/* IMAGE box */}
                        <div className="w-full h-[180px] rounded-2xl overflow-hidden shadow-sm mt-5 transition-shadow duration-300 group-hover:shadow-2xl">
                            <img
                                src={project.heroImage ?? "/images/placeholder.svg"}
                                alt={project.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* INFO CARD FLOATING UNDER IMAGE */}
                        <div className="absolute left-3 right-3 top-40 bg-white rounded-[15px] shadow-sm p-3 transition-shadow duration-300 group-hover:shadow-md">
                            {/* Row 1 */}
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-base font-medium text-gray-900 truncate">
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
