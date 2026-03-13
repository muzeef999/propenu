"use client";

import { useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import NearByPlaceClient from "@/app/(pages)/properties/(pages)/NearByPlaceClient";
import type { NearbyPlace } from "@/types/land";
import { LocationIcon } from "@/icons/icons";

type Location = {
  type: "Point";
  coordinates: [number, number];
};

type Props = {
  projectLocation: Location;
  projectName: string;
  nearbyLandmarks: NearbyPlace[];
};

export default function LandNearbySection({
  projectLocation,
  projectName,
  nearbyLandmarks,
}: Props) {
  const accentColor = "#1c4ed9";
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
  const sliderRef = useRef<HTMLUListElement | null>(null);

  const focusedPlace = useMemo(() => {
    if (selectedPlaceIndex === null) return undefined;
    return nearbyLandmarks[selectedPlaceIndex];
  }, [nearbyLandmarks, selectedPlaceIndex]);

  const scrollSlider = (direction: "left" | "right") => {
    if (!sliderRef.current) return;

    const firstCard = sliderRef.current.querySelector("li");
    if (!firstCard) return;

    const gap = 16;
    const cardWidth = firstCard.clientWidth + gap;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollSlider("left")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Previous nearby places"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => scrollSlider("right")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Next nearby places"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6 w-full min-w-0 overflow-hidden">
        <ul
          ref={sliderRef}
          className="flex w-full min-w-0 gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {nearbyLandmarks.length ? (
            nearbyLandmarks.map((place, index) => {
              const placeName = place?.name?.split(",")[0] || "Nearby place";
              const isActive = selectedPlaceIndex === index;
              const distanceText = place?.distanceText ?? "Nearby";

              return (
                <li
                  key={`${placeName}-${index}`}
                  onClick={() => setSelectedPlaceIndex(index)}
                  className={`w-[280px] shrink-0 cursor-pointer rounded-md p-3 transition sm:w-[320px] ${
                    isActive
                      ? "ring-2 ring-emerald-300 ring-offset-2"
                      : "hover:bg-[#eef1f3]"
                  }`}
                  style={{
                    backgroundColor: "#f1f4f5",
                    boxShadow: isActive ? `0 6px 20px ${accentColor}22` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#dde9ee]">
                      <LocationIcon size={25} color={accentColor} />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-slate-900">
                        {placeName}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {placeName} • {distanceText}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-slate-500">No nearby places provided.</li>
          )}
        </ul>
      </div>

      <NearByPlaceClient
        projectLocation={projectLocation}
        projectName={projectName}
        nearbyPlaces={nearbyLandmarks}
        focusedPlace={focusedPlace}
      />
    </div>
  );
}
