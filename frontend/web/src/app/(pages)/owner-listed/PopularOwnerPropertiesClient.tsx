"use client";

import { useRef } from "react";
import Link from "next/link";
import { RiArrowRightSLine } from "react-icons/ri";
import { useCity } from "@/hooks/useCity";
import { ArrowDropdownIcon } from "@/icons/icons";
import { PopularOwnerProperty } from "@/types";
import ResidentialCard from "../properties/cards/ResidentialCard";
import CommercialCard from "../properties/cards/CommercialCard";
import { LandCard } from "../properties/cards/LandCard";
import AgriculturalCard from "../properties/cards/AgriculturalCard";

interface Props {
  items?: PopularOwnerProperty[];
  
}

const PopularOwnerPropertiesClient = ({ items = [] }: Props) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { city } = useCity();

  console.log("Popular Owner Properties Items:", items);

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
        {items.map((item: any) => {
          const wrapperClass ="min-w-[100%] lg:min-w-[31%] xl:min-w-[18%] snap-start";

          if (item.type === "residential") {
            return (
              <div key={item._id} className={wrapperClass}>
                <ResidentialCard p={item}/>
              </div>
            );
          }
          if (item.type === "commercial") {
            return (
              <div key={item._id} className={wrapperClass}>
                <CommercialCard p={item} />
              </div>
            );
          }
          if (item.type === "land") {
            return (
              <div key={item._id} className={wrapperClass}>
                <LandCard p={item} />
              </div>
            );
          }
          if (item.type === "agricultural") {
            return (
              <div key={item._id} className={wrapperClass}>
                <AgriculturalCard p={item} />
              </div>
            );
          }
          return null;
        })}
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
