"use client";

import { useRef } from "react";
import Link from "next/link";
import { LuBed, LuRuler } from "react-icons/lu";
import { TbBath } from "react-icons/tb";
import { RiArrowRightSLine } from "react-icons/ri";

import { useCity } from "@/hooks/useCity";
import { ArrowDropdownIcon, LocationIcon } from "@/icons/icons";
import formatINR from "@/utilies/PriceFormat";

interface Props {
  items?: any[];
}

const PopularOwnerPropertiesClient = ({ items = [] }: Props) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { city } = useCity();

  // scroll by half of the visible slider width for a more predictable jump
  const scrollBy = (dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const step = Math.floor(el.clientWidth / 2);
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex justify-between items-center">
          <div className="headingSideBar">
            <h1 className="text-2xl font-bold">Popular Owner Properties</h1>
            <p className="headingDesc">
              Building excellence in {city?.name ?? "Hyderabad"}
            </p>
          </div>
        </div>

        <Link
          href="/featured"
          className="flex items-center gap-1 text-green-600 hover:text-green-700"
          aria-label="View all featured properties"
        >
          View All <RiArrowRightSLine size={18} />
        </Link>
      </div>

      {/* Left arrow */}
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy("left")}
        className="absolute left-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-90" />
      </button>

      {/* Carousel */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-2 py-2 snap-x snap-mandatory"
        role="list"
      >
        {items.map((project: any) => (
          <article
            key={project._id}
            role="listitem"
            className="
              min-w-[92%]             /* mobile: show ~1 card */
              sm:min-w-[48%]          /* small tablets: ~2 cards */
              md:min-w-[31%]          /* desktops: ~3 cards */
              lg:min-w-[22%]          /* large laptop: ~4 cards */
              xl:min-w-[18%]          /* extra-large: ~5 cards */
              card rounded-md bg-white shadow-sm snap-start
            "
          >
            <Link
              href={`/owner-listed/${project.slug}`}
              className="block group"
              aria-label={project?.title ?? "Property details"}
            >
              <div className="h-[200px] w-full overflow-hidden rounded-t-md">
                <img
                  src={project?.images?.[0]?.url ?? "/images/placeholder.svg"}
                  alt={project?.title ?? "Property image"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-[18px] font-semibold leading-tight text-slate-900 truncate"
                    title={project?.title}
                  >
                    {project?.title ?? "Untitled Property"}
                  </h3>

                  <div className="ml-auto flex items-end whitespace-nowrap">
                    <span className="text-[16px] font-semibold text-green-700">
                      {formatINR(project?.price)}
                    </span>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                  <LocationIcon size={16} color={"#374151"} />
                  <span className="line-clamp-1">
                    {project?.address?.addressLine ?? "Location not specified"}
                  </span>
                </div>

                <div className="h-px w-full bg-slate-100" />

                {/* SPECS */}
                <div className="grid grid-cols-3 text-[14px] font-medium text-slate-800">
                  <div className="flex items-center justify-center gap-1.5 px-1">
                    <LuBed className="text-[18px]" />
                    <span>{project?.details?.bhk ?? "-"}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 border-x border-slate-100 px-1">
                    <TbBath className="text-[18px]" />
                    <span>{project?.details?.bathrooms ?? "-"}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 px-1">
                    <LuRuler className="text-[18px]" />
                    <span>{project?.area ?? "-"}</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy("right")}
        className="absolute right-[-1.2%] top-1/2 -translate-y-1/2 z-20 hidden sm:inline-flex items-center justify-center bg-white p-2 rounded-full shadow-md hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        <ArrowDropdownIcon size={16} className="rotate-270" />
      </button>
    </section>
  );
};

export default PopularOwnerPropertiesClient;
