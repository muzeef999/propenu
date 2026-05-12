"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";
import { RiArrowRightSLine } from "react-icons/ri";
import { getHighlightProjects } from "@/data/ClientData";
import HomeSectionSkeleton from "@/components/HomeSectionSkeleton";
import { minDelay } from "@/utilies/minDelay";
import formatINR from "@/utilies/PriceFormat";
import { getProjectConfigurationLabel } from "@/utilies/projectConfiguration";
import { GoHeart, GoHeartFill } from "react-icons/go";
import Topselllingcomingsoon from "./Topselllingcomingsoon";
import {
  getHomeSectionCache,
  getHomeSectionCacheKey,
  setHomeSectionCache,
} from "@/utilies/homeSectionCache";
import { useShortlist } from "@/hooks/useShortlist";

function HighlightProjectCard({ project }: { project: FeaturedProject }) {
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    project._id,
    "FeaturedProject",
  );
  const projectHref =
    project.promotion?.type === "prime"
      ? `/prime/${project.slug}`
      : `/project/${project.slug}`;

  return (
    <Link
      key={project._id}
      href={projectHref}
      className="relative shrink-0 snap-start group cursor-pointer transition-all duration-300 hover:-translate-y-2 w-[260px] sm:w-[280px] md:w-[320px]"
    >
      <div className="relative mt-5 w-full overflow-hidden rounded-2xl h-[150px] sm:h-[170px] md:h-[180px] shadow-sm transition-shadow duration-300 group-hover:shadow-2xl">
        <img
          src={project.heroImage ?? "/images/placeholder.svg"}
          alt={project.title}
          className="h-full w-full object-cover"
        />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleShortlist();
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 hover:scale-110 active:scale-95"
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
      </div>

      <div className="absolute left-3 right-3 top-[130px] sm:top-[140px] md:top-[150px] bg-white rounded-xl p-3 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 truncate">
            {project.title}
          </h2>

          <span className="text-sm font-medium whitespace-nowrap">
            {project?.priceFrom ? (
              <>
                <span className="text-[#26ad5f]">
                  {formatINR(project.priceFrom)}
                </span>{" "}
                <span className="text-[#676666] font-light text-sm">onwards</span>
              </>
            ) : (
              "—"
            )}
          </span>
        </div>

        <p className="text-xs text-gray-500 truncate font-medium capitalize">
          {getProjectConfigurationLabel(project, "Apartments")}
          {project.locality ? ` • ${project.locality}` : ""}
          {project.state ? `, ${project.state}` : ""}
        </p>
      </div>
    </Link>
  );
}

export default function HighlightProjectsClient() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { selectedCity } = useCity();
  const cacheKey = getHomeSectionCacheKey("highlight-projects", {
    state: selectedCity?.state,
    city: selectedCity?.city,
  });
  const [items, setItems] = useState<FeaturedProject[]>(
    () => getHomeSectionCache<FeaturedProject[]>(cacheKey) ?? [],
  );
  const [loading, setLoading] = useState(() => !getHomeSectionCache(cacheKey));
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!selectedCity) return;

    const cachedItems = getHomeSectionCache<FeaturedProject[]>(cacheKey);
    if (cachedItems) {
      setItems(cachedItems);
      setLoading(false);
      return;
    }

    let isActive = true;

    setLoading(true);
    setItems([]);

    Promise.all([
      getHighlightProjects({
        state: selectedCity.state,
        city: selectedCity.city,
      }),
      minDelay(),
    ])
      .then(([res]) => {
        if (!isActive) return;

        const nextItems = res.items || [];
        setHomeSectionCache(cacheKey, nextItems);
        setItems(nextItems);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("❌ Featured fetch failed:", err);
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [cacheKey, selectedCity]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || loading || items.length === 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const updateScrollButtons = () => {
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

      setCanScrollLeft(slider.scrollLeft > 1);
      setCanScrollRight(slider.scrollLeft < maxScrollLeft - 1);
    };

    updateScrollButtons();
    slider.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      slider.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [items, loading]);

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
  const hasItems = items.length > 0;

  return (
    <div className="relative w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">

        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Top Selling Properties
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Investment-worthy in {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
        {!loading && hasItems && (
          <Link
            href="/highlight-projects"
            aria-label="View all featured properties"
            className="shrink-0 flex items-center gap-1 text-sm sm:text-base text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
          >
            View All <RiArrowRightSLine size={18} />
          </Link>
        )}
      </div>

      {/* Navigation Buttons */}
      {/* Left button */}
      {!loading && hasItems && canScrollLeft && (
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-2 lg:-left-3 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
        >
          <ArrowDropdownIcon size={16} className="rotate-90" />
        </button>
      )}

      {/* Right button */}
      {!loading && hasItems && canScrollRight && (
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className=" hidden md:flex absolute right-2 lg:-right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <ArrowDropdownIcon size={16} className="rotate-270" />
        </button>
      )}

 

      {/* Scrollable Container */}
      {loading ? (
        <div
          ref={sliderRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-6 snap-x snap-mandatory px-1"
        >
          <HomeSectionSkeleton variant="highlight" count={3} />
        </div>
      ) : hasItems ? (
        <div
          ref={sliderRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-6 snap-x snap-mandatory px-1"
        >
          {items.map((project) => (
            <HighlightProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <Topselllingcomingsoon />
      )}
    </div>
  );
}
