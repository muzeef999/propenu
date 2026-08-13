"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDropdownIcon } from "@/icons/icons";
import { MdLocationPin, MdVerifiedUser } from "react-icons/md"; // Added MdVerified import
import { AgentConnect } from "@/types";
import { RiArrowRightSLine } from "react-icons/ri";
import { useCity } from "@/hooks/useCity";
import { getAgentConnect } from "@/data/ClientData";
import HomeSectionSkeleton from "@/components/HomeSectionSkeleton";
import { minDelay } from "@/utilies/minDelay";
import {
  getHomeSectionCache,
  getHomeSectionCacheKey,
  setHomeSectionCache,
} from "@/utilies/homeSectionCache";
import AgentsComingSoon from "./AgentsComingSoon";

export default function AgentsList() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { selectedCity } = useCity();
  const cacheKey = getHomeSectionCacheKey("agent-connect", {
    city: selectedCity?.city,
  });
  const [agents, setAgents] = useState<AgentConnect[]>(
    () => getHomeSectionCache<AgentConnect[]>(cacheKey) ?? [],
  );
  const [loading, setLoading] = useState(() => !getHomeSectionCache(cacheKey));
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!selectedCity) return;

    const cachedAgents = getHomeSectionCache<AgentConnect[]>(cacheKey);
    if (cachedAgents) {
      setAgents(cachedAgents);
      setLoading(false);
      return;
    }

    let isActive = true;

    setLoading(true);
    setAgents([]);

    Promise.all([
      getAgentConnect({
        city: selectedCity.city,
      }),
      minDelay(),
    ])
      .then(([res]) => {
        if (!isActive) return;

        const nextAgents = res.items || [];
        setHomeSectionCache(cacheKey, nextAgents);
        setAgents(nextAgents);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("❌ Agent fetch failed:", err);
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

  // Gate: arrows only make sense when there are more than 4 cards.
  const hasMoreThanFour = agents.length > 4;

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
  }, [agents, loading, hasMoreThanFour]);

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

  const hasItems = agents.length > 0;
  // "View All" link is shown only when there are overflow cards.
  const showViewAll = !loading && hasMoreThanFour;

  return (
    <div className="relative w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Heading */}
        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Agent Connect
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Expert help, simplified
          </p>
        </div>

        {/* Right: View All */}
        {showViewAll && (
          <Link
            href="/agent-connect"
            aria-label="View all agents"
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
            className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <ArrowDropdownIcon size={16} color="#26ad5f" className="rotate-270" />
          </button>
        )}

        {/* Scrollable Container */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar pb-8 pt-2 px-2 sm:px-3">
            <HomeSectionSkeleton variant="agent" count={4} />
          </div>
        ) : hasItems ? (
          <div
            ref={sliderRef}
            className="flex gap-3.5 overflow-x-auto scroll-smooth no-scrollbar pb-8 pt-2 px-2 sm:px-3"
          >
            {agents.map((agent) => (
              <div
                key={agent._id}
                className="w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] shrink-0 flex flex-col"
              >
                <AgentCard data={agent} />
              </div>
            ))}
          </div>
        ) : (
          <AgentsComingSoon city={selectedCity?.city} state={selectedCity?.state} />
        )}
      </div>
    </div>
  );
}

// Agent Card Component
function AgentCard({ data }: { data: AgentConnect }) {
  return (
    <Link
      href={`/agent-connect/${data.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full w-full min-w-0"
    >
      <div className="card w-full h-full flex flex-col justify-between min-w-0 overflow-hidden">
        {/* Banner */}
        <div className="h-28 relative shrink-0">
          <Image
            src={data.coverImage?.url || "/placeholder.jpg"}
            alt="Banner"
            fill
            className="object-cover brightness-95 rounded-t-xl"
          />
          <div
            aria-label="primary"
            className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#26ad5f] text-white px-4 py-1 rounded-md shadow-sm"
          >
            <MdVerifiedUser size={16} />
            <span className="text-xs font-bold">Verified</span>
          </div>

          {/* Profile Picture */}
          <div className="absolute left-5 -bottom-10 h-20 w-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
            <Image
              src={data.avatar?.url || "/images/UserPlaceholder.webp"}
              alt={data.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 pb-5 px-5 flex flex-col justify-between grow min-w-0">
          {/* Title + Headline */}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
              {data.name}
            </h2>
            <p className="text-sm font-medium text-green-600 truncate min-h-[20px]">
              {data.agencyName}
            </p>

            {data.bio ? (
              <p className="text-sm text-gray-500 mt-2 leading-snug line-clamp-2">
                {data.bio}
              </p>
            ) : null}

            <p className="text-sm text-gray-500 mt-2 flex items-center min-h-[24px] min-w-0">
              <MdLocationPin className="mr-1 text-gray-400 shrink-0" size={18} />
              <span className="truncate min-w-0 block">{data.areasServed?.join(", ") || ""}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
