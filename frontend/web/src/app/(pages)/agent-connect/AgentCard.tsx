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
import HomeSectionComingSoon from "@/components/HomeSectionComingSoon";
import { minDelay } from "@/utilies/minDelay";
import {
  getHomeSectionCache,
  getHomeSectionCacheKey,
  setHomeSectionCache,
} from "@/utilies/homeSectionCache";

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
  const hasItems = agents.length > 0;


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
        <Link
          href="/agent-connect"
          aria-label="View all featured properties"
          className="shrink-0 flex items-center gap-1 text-sm sm:text-base text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
        >
          View All <RiArrowRightSLine size={18} />
        </Link>
      </div>

      {/* Navigation Buttons */}
      {!loading && hasItems && (
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
        >
          <ArrowDropdownIcon size={16} className="rotate-90" />
        </button>
      )}

      {!loading && hasItems && (
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
        >
          <ArrowDropdownIcon size={16} className="-rotate-90" />
        </button>
      )}

      {/* Scrollable Container */}
      {loading ? (
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar pb-8 pt-2 snap-x snap-mandatory px-1"
        >
          <HomeSectionSkeleton variant="agent" count={3} />
        </div>
      ) : hasItems ? (
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar pb-8 pt-2 snap-x snap-mandatory px-1"
        >
          {agents.map((agent) => (
            <div key={agent._id} className="snap-start shrink-0 px-1 py-1">
              <AgentCard data={agent} />
            </div>
          ))}
        </div>
      ) : (
        <HomeSectionComingSoon
          title="Agent Connect Is Coming Soon"
          description={`We’re onboarding trusted agents for ${selectedCity?.city ?? "your city"}. You’ll see expert profiles here as soon as they’re available.`}
        />
      )}
    </div>
  );
}

// Agent Card Component
function AgentCard({ data }: { data: AgentConnect }) {
  return (
    <Link href={`/agent-connect/${data.slug}`}>
      <div className="card w-[300px]">
        {/* Banner */}
        <div className="h-28 relative ">
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
              src={data.avatar?.url || "/placeholder.jpg"}
              alt={data.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 pb-5 px-5 flex flex-col justify-between min-h-[210px]">
          {/* Title + Headline */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {data.name}
            </h2>
            <p className="text-sm font-medium text-green-600">
              {data.agencyName}
            </p>

            <p className="text-sm text-gray-500 mt-2 leading-snug line-clamp-2 truncate">
              {data.bio}
            </p>

            <p className="text-sm text-gray-500 mt-2 truncate flex items-center">
              <MdLocationPin className="mr-1 text-gray-400" size={18} />
              {data.areasServed?.join(", ")}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xl font-medium text-green-600 leading-none">
                {data.stats?.publishedCount}
              </p>
              <p className="text-sm text-gray-500 mt-1">For Sale</p>
            </div>

            <div className="text-center">
              <p className="text-xl font-medium text-green-600 leading-none">
                {data.stats?.totalProperties}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total properties</p>
            </div>

            <div className="text-center">
              <p className="text-xl font-medium text-green-600 leading-none">
                {data.dealsClosed}
              </p>
              <p className="text-sm text-gray-500 mt-1">Deal Closed</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
