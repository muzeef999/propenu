"use client";

import React, { useMemo, useState } from "react";
import { amenityTitleToIconPath } from "@/lib/amenityIcons";
import { hexToRGBA } from "@/ui/hexToRGBA";

export type Amenity = {
  key?: string;
  title?: string;
  description?: string;
  imageUrl?: string; // optional custom image URL (uploaded)
};

type AmenityPropPayload = {
  amenities?: Amenity[] | null;
  color?: string | null;
  heading?: string;
  cols?: 2 | 3 | 4;
};

type Props = {
  // Accept either an array of Amenity OR the payload object you created earlier
  amenities?: Amenity[] | AmenityPropPayload | null;
  primaryColor?: string | null; // an explicit override color (if provided)
  heading?: string;
  cols?: 2 | 3 | 4;
};

function normalizeProps(
  incoming?: Amenity[] | AmenityPropPayload | null,
  explicitColor?: string | undefined,
  explicitHeading?: string | undefined,
  explicitCols?: 2 | 3 | 4 | undefined
) {
  if (Array.isArray(incoming)) {
    return {
      items: incoming as Amenity[],
      color: explicitColor ?? "#F59E0B",
      heading: explicitHeading ?? "Amenities",
      cols: explicitCols ?? 3,
    };
  }
  const payload = (incoming || {}) as AmenityPropPayload;
  return {
    items: Array.isArray(payload.amenities) ? (payload.amenities as Amenity[]) : [],
    color: (explicitColor ?? payload.color) ?? "#F59E0B",
    heading: explicitHeading ?? payload.heading ?? "Amenities",
    cols: explicitCols ?? payload.cols ?? 3,
  };
}

export default function Amenities(props: Props) {
  const { amenities: rawAmenities, primaryColor, heading: headingProp, cols: colsProp } = props;

  const { items, color, heading, cols } = useMemo(
    () => normalizeProps(rawAmenities, primaryColor ?? undefined, headingProp, colsProp),
    [rawAmenities, primaryColor, headingProp, colsProp]
  );

  const [query, setQuery] = useState("");

  // color handling
  const accent = typeof color === "string" ? color.trim() : "#F59E0B";
  const pillBg = hexToRGBA(accent, 0.08); // very light background
  const pillBorder = accent;
  const iconBg = hexToRGBA(accent, 0.12);

  // filter by search query (optional)
  const filtered = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const t = (a.title || "").toLowerCase();
      const d = (a.description || "").toLowerCase();
      const k = (a.key || "").toLowerCase();
      return t.includes(q) || d.includes(q) || k.includes(q);
    });
  }, [items, query]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div  style={{color:color, borderLeft:`5px solid ${color}`}}>
              <div className="ml-2">
            <h1 className="text-2xl font-bold">
              Amenities
            </h1>
            <p className="headingDesc">
             Building excellence in Hyderabad
            </p>
          </div>
          </div>
          <br/>

      </div>
      <br/>

      <div className="flex flex-wrap gap-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-slate-500">No amenities available.</div>
        ) : (
          filtered.map((a, idx) => {
            const key = a.key ?? a.title ?? `amenity-${idx}`;
            const title = a.title ?? "Amenity";
            // icon priority: uploaded imageUrl -> local icon path from mapping -> default placeholder
            const iconSrc = a.imageUrl ?? amenityTitleToIconPath(title) ?? "/icons/amenities/default.svg";

            return (
              <button
                key={key}
                type="button"
                title={title}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-shadow hover:shadow-sm focus:outline-none"
                style={{
                  border: `1px solid ${pillBorder}`,
                  backgroundColor: pillBg,
                  color:color,
                }}
              >
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    background: iconBg,
                  }}
                >
                  <img
                    src={iconSrc}
                    alt={title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).onerror = null;
                      (e.currentTarget as HTMLImageElement).src = "/icons/amenities/default.svg";
                    }}
                    className="w-4 h-4"
                  />
                </span>

                <span className="whitespace-nowrap">{title}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
