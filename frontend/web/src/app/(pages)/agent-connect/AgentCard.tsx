"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDropdownIcon } from "@/icons/icons";
import { MdLocationPin, MdVerifiedUser } from "react-icons/md"; // Added MdVerified import
import { AgentConnect } from "@/types";

interface Props {
  Agent?: AgentConnect[];
}

export default function AgentsList({ Agent = [] }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);

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
    <div className="relative w-full py-1">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="headingSideBar">
          <h1 className="text-2xl font-bold">Agent Connect</h1>
          <p className="headingDesc">Trusted professionals guiding your property journey</p>
        </div>
        <Link href="/agent-connect" className="text-green-600 font-medium text-sm hover:underline">
          View All
        </Link>
      </div>

      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Scroll left"
        className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-90" />
      </button>

      <button
        type="button"
        onClick={scrollRight}
        aria-label="Scroll right"
        className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex bg-white p-2 rounded-full shadow-md hover:shadow-xl cursor-pointer transition-all duration-300"
      >
        <ArrowDropdownIcon size={16} className="-rotate-90" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={sliderRef}
        className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-8 pt-2 snap-x snap-mandatory px-1"
      >
        {Agent.map((agent) => (
          <div key={agent._id} className="snap-start shrink-0">
            <AgentCard data={agent} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Agent Card Component
function AgentCard({ data }: { data: AgentConnect }) {
  return (
    <div className="card">
      {/* Banner */}
      <div className="h-28 relative ">
        <Image
          src={data.coverImage?.url || "/placeholder.jpg"}
          alt="Banner"
          fill
          className="object-cover brightness-95 rounded-t-xl"
        />
        <div aria-label="primary" className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#26ad5f] text-white px-4 py-1 rounded-md shadow-sm">
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
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{data.name}</h2>
          <p className="text-sm font-medium text-green-600">{data.agencyName}</p>

          <p className="text-sm text-gray-500 mt-2 leading-snug line-clamp-2">{data.bio}</p>

          <p className="text-sm text-gray-500 mt-2 truncate flex items-center">
            <MdLocationPin className="mr-1 text-gray-400" size={18} />
            {data.areasServed?.join(", ")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xl font-medium text-green-600 leading-none">{data.stats?.publishedCount}</p>
            <p className="text-sm text-gray-500 mt-1">For Sale</p>
          </div>

          <div className="text-center">
            <p className="text-xl font-medium text-green-600 leading-none">{data.stats?.totalProperties}</p>
            <p className="text-sm text-gray-500 mt-1">Total properties</p>
          </div>

          <div className="text-center">
            <p className="text-xl font-medium text-green-600 leading-none">{data.dealsClosed}</p>
            <p className="text-sm text-gray-500 mt-1">Deal Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}