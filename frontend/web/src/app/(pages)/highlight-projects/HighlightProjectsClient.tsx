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
import { FiShare2 } from "react-icons/fi";
import Topselllingcomingsoon from "./Topselllingcomingsoon";
import {
  getHomeSectionCache,
  getHomeSectionCacheKey,
  setHomeSectionCache,
} from "@/utilies/homeSectionCache";
import { useShortlist } from "@/hooks/useShortlist";
import { IoMdShareAlt } from "react-icons/io";
import { RATE_LIMIT_RECOVERED_EVENT } from "@/utilies/requestMonitor";
import { trackInteraction } from "@/services/trackingService";

function HighlightProjectCard({ project }: { project: FeaturedProject }) {
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    project._id,
    "FeaturedProject",
  );
  const projectHref =
    project.promotion?.type === "prime"
      ? `/prime/${project.slug}`
      : `/project/${project.slug}`;

  const shareProject = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl =
      typeof window !== "undefined" ? new URL(projectHref, window.location.origin).toString() : "";
    const shareData = {
      title: project.title,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Ignore cancelled share or clipboard errors.
    }
  };

  return (
    <Link
      key={project._id}
      href={projectHref}
      onClick={() => {
        trackInteraction({
          eventType: "project_click",
          eventCategory: "project_engagement",
          entityType: "project",
          projectId: project._id,
          promotionType: project.promotion?.type || "featured",
          source: "homepage",
          placement: "featured_projects",
          metadata: { projectName: project.title, projectSlug: project.slug },
        });
      }}
      className="relative shrink-0 snap-start group cursor-pointer transition-all duration-300 hover:-translate-y-2 w-[260px] sm:w-[280px] md:w-[320px]"
    >
      <div className="relative mt-5 w-full overflow-hidden rounded-2xl h-[150px] sm:h-[170px] md:h-[180px] shadow-sm transition-shadow duration-300 group-hover:shadow-2xl">
        <img
          src={project.heroImage ?? "/images/placeholder.svg"}
          alt={project.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={shareProject}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 hover:scale-110 active:scale-95"
            title="Share project"
            aria-label="Share project"
          >
            <IoMdShareAlt className="h-4.5 w-4.5 text-gray-700" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleShortlist();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 hover:scale-110 active:scale-95"
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
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const retryAfterRateLimit = () => setRetryKey((value) => value + 1);
    window.addEventListener(RATE_LIMIT_RECOVERED_EVENT, retryAfterRateLimit);
    return () => window.removeEventListener(RATE_LIMIT_RECOVERED_EVENT, retryAfterRateLimit);
  }, []);

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
  }, [cacheKey, selectedCity, retryKey]);

  // Gate: arrows only make sense when there are more than 4 cards.
  const hasMoreThanFour = items.length > 4;

  useEffect(() => {
    const slider = sliderRef.current;

    // Reset when there are no cards, still loading, or ≤4 cards.
    if (!slider || loading || !hasMoreThanFour) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const updateScrollButtons = () => {
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
      // Left arrow: only after the user has scrolled away from the start.
      setCanScrollLeft(slider.scrollLeft > 10);
      // Right arrow: hidden only when fully scrolled to the end.
      setCanScrollRight(slider.scrollLeft < maxScrollLeft - 10);
    };

    // Double-rAF: wait for two paint frames so the DOM has fully reflowed
    // before measuring scrollWidth (single rAF can fire before layout is done).
    let frameId: number;
    const outerFrameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(updateScrollButtons);
    });

    slider.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      window.cancelAnimationFrame(outerFrameId);
      window.cancelAnimationFrame(frameId);
      slider.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [items, loading, hasMoreThanFour]);

  const scrollBy = (dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const step = Math.floor(el.clientWidth / 2);
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
    // Re-evaluate after the smooth scroll animation (~300 ms) finishes.
    setTimeout(() => {
      if (!el) return;
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - 10);
    }, 350);
  };
  const hasItems = items.length > 0;
  const showViewAll = !loading && hasMoreThanFour;

  return (
    <div className="relative w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">

        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Top Selling Projects
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Investment-worthy in {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
        {showViewAll && (
          <Link
            href="/highlight-projects"
            aria-label="View all featured properties"
            className="shrink-0 flex items-center gap-1 text-sm sm:text-base text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
          >
            View All <RiArrowRightSLine size={18} />
          </Link>
        )}
      </div>

      {/* Slider area — own relative wrapper so arrow top-1/2 is scoped here */}
      <div className="relative">
        {/* Left arrow */}
        {!loading && hasItems && canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy("left")}
            className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <ArrowDropdownIcon size={16} color="#26ad5f" className="rotate-90" />
          </button>
        )}

        {/* Right arrow */}
        {!loading && hasItems && canScrollRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy("right")}
            className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <ArrowDropdownIcon size={16} color="#26ad5f" className="rotate-270" />
          </button>
        )}

        {/* Scrollable Container */}
        {loading ? (
          <div
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
    </div>
  );
}
