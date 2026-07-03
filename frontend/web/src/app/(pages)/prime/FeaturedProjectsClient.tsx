"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FeaturedProject } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useCity } from "@/hooks/useCity";
import Image from "next/image";
import formatINR from "@/utilies/PriceFormat";
import { getFeaturedProjects } from "@/data/ClientData";
import { minDelay } from "@/utilies/minDelay";
import { getProjectConfigurationLabel } from "@/utilies/projectConfiguration";
import {
  getHomeSectionCache,
  getHomeSectionCacheKey,
  setHomeSectionCache,
} from "@/utilies/homeSectionCache";
import { useShortlist } from "@/hooks/useShortlist";
import { GoHeart, GoHeartFill } from "react-icons/go";

function PrimeProjectCard({ project }: { project: FeaturedProject }) {
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    project._id,
    "FeaturedProject",
  );

  return (
    <div className="shrink-0 w-[90%] sm:w-[calc(50%-0.5rem)] lg:w-[calc(50%-0.5rem)] card snap-start group">
      <Link
        href={`/prime/${project.slug}`}
        className="relative block overflow-hidden rounded-t-md h-40 sm:h-[50px] md:h-[200px] lg:h-[220px]"
      >
        <Image
          src={project.heroImage ?? "/images/placeholder.svg"}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
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
      </Link>

      <div className="p-3 flex justify-between items-center gap-3">
        <div className="shrink-0">
          <Image
            src={project?.logo?.url ?? "/images/placeholder.svg"}
            alt={`${project.title} logo`}
            width={64}
            height={64}
            className="object-contain rounded-md w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>

        <div className="flex flex-col justify-center grow min-w-0">
          <h2 className="text-lg md:text-xl font-medium text-left truncate">
            {project.title}
          </h2>

          {project.address && (
            <p className="text-gray-500 text-sm mt-1 truncate">
              {project.address}
            </p>
          )}
        </div>

        <div className="text-right flex flex-col items-end gap-1 shrink-0">
          <p className="text-gray-600 font-light text-sm md:text-base">
            {getProjectConfigurationLabel(project, "Flats")}
          </p>

          <p className="text-[#26ad5f] text-sm md:text-base font-medium">
            {formatINR(project?.priceFrom)}
            <span className="text-[#676666] font-light text-sm">
              {" "}
              onwards
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProjectsClient() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { selectedCity } = useCity();
  const cacheKey = getHomeSectionCacheKey("featured-projects", {
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
      getFeaturedProjects({
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

  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;

    if (!el || loading || !items.length) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    updateScrollState();

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items, loading, updateScrollState]);


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
  const hasItems = items.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Left Arrow */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Prime Projects
          </h1>

          <p className="mt-1 text-sm text-gray-500 sm:text-base ">
            Stand out for the lifestyle they offer in {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
      </div>

      {!loading && hasItems && canScrollLeft && (
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 -translate-x-1/2 hidden md:flex items-center justify-center"
        >
          <ArrowDropdownIcon size={20} className="rotate-90" />
        </button>
      )}

      {/* Scrollable Row */}
      {!loading && hasItems ? (
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-1 py-2 snap-x snap-mandatory"
        >
          {items.map((project) => (
            <PrimeProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : null}

      {/* Right Arrow */}
      {!loading && hasItems && canScrollRight && (
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 translate-x-1/2 hidden md:flex items-center justify-center"
        >
          <ArrowDropdownIcon size={20} className="-rotate-90" />
        </button>
      )}
    </div>
  );
}
