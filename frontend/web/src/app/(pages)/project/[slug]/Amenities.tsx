"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FeaturedProject, IAmenity } from "@/types";
import { amenityTitleToIconPath } from "@/lib/amenityIcons";

type AmenitiesProps = {
  project: FeaturedProject;
};

const INITIAL_VISIBLE_COUNT = 11;

function getAmenityTitle(amenity: IAmenity) {
  return amenity.title ?? amenity.key ?? "Amenity";
}

function getAmenityIcon(amenity: IAmenity) {
  if (amenity.icon) return amenity.icon.trim();
  return amenityTitleToIconPath(getAmenityTitle(amenity));
}

export default function Amenities({ project }: AmenitiesProps) {
  const [showAll, setShowAll] = useState(false);
  const amenities = useMemo(
    () => (Array.isArray(project.amenities) ? project.amenities : []),
    [project.amenities],
  );

  if (!amenities.length) {
    return null;
  }

  const hiddenCount = Math.max(amenities.length - INITIAL_VISIBLE_COUNT, 0);
  const visibleAmenities = showAll
    ? amenities
    : amenities.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <section id="amenities">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-5 py-5 text-xl font-medium text-slate-950">
            Amenities
          </h2>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-5 py-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visibleAmenities.map((amenity, index) => {
              const title = getAmenityTitle(amenity);
              const iconSrc = getAmenityIcon(amenity);

              return (
                <div
                  key={`${amenity.key ?? title}-${index}`}
                  className="flex min-h-14 flex-col items-center justify-start text-center"
                >
                  <img
                    src={iconSrc}
                    alt=""
                    className="h-5 w-5 object-contain"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/icons/amenities/default.svg";
                    }}
                  />
                  <p className="mt-2 max-w-28 text-sm font-medium leading-5 text-slate-950">
                    {title}
                  </p>
                </div>
              );
            })}

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="flex min-h-20 flex-col items-center justify-center rounded-md bg-emerald-50 px-4 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100"
              >
                <span>{showAll ? "Show" : `+${hiddenCount}`}</span>
                <span className="mt-1 inline-flex items-center gap-1">
                  {showAll ? "Less" : "More"}
                  {showAll ? (
                    <FiChevronUp className="h-4 w-4" />
                  ) : (
                    <FiChevronDown className="h-4 w-4" />
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
