// components/Amenities.tsx
"use client";

import React, { useMemo, useState } from "react";

export type Amenity = {
  key?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
};

/**
 * Accept either:
 * - an array: amenities={Amenity[]}
 * - an object payload: amenities={{ amenities: Amenity[], color: string, heading?: string, cols?: 2|3|4 }}
 */
type AmenityPropPayload = {
  amenities?: Amenity[] | null;
  color?: string | null;
  heading?: string;
  cols?: 2 | 3 | 4;
};

type Props = {
  // allow union: either direct array or payload object
  amenities?: Amenity[] | AmenityPropPayload | null;
  primaryColor?: string;
  heading?: string;
  cols?: 2 | 3 | 4;
};

/**
 * DEV fallback image path — replace with a public asset or imported image in production
 */
const DEV_FALLBACK_IMAGE = "/images/amenity-fallback.jpg";

/** Small helper to normalize incoming prop shape to { items, color, heading, cols } */
function normalizeProps(incoming?: Amenity[] | AmenityPropPayload | null, explicitColor?: string | undefined, explicitHeading?: string | undefined, explicitCols?: 2 | 3 | 4 | undefined) {
  // if incoming is array -> use it directly
  if (Array.isArray(incoming)) {
    return {
      items: incoming as Amenity[],
      color: explicitColor ?? "#F59E0B",
      heading: explicitHeading ?? "Amenities",
      cols: explicitCols ?? 3,
    };
  }

  // if incoming is object payload (or undefined)
  const payload = (incoming || {}) as AmenityPropPayload;
  return {
    items: Array.isArray(payload.amenities) ? payload.amenities : [],
    color: (explicitColor ?? payload.color) ?? "#F59E0B",
    heading: explicitHeading ?? payload.heading ?? "Amenities",
    cols: explicitCols ?? payload.cols ?? 3,
  };
}

export default function Amenities(props: Props) {
  const { amenities: rawAmenities, primaryColor, heading: headingProp, cols: colsProp } = props;

  const { items, color, heading, cols } = useMemo(
    () => normalizeProps(rawAmenities, primaryColor, headingProp, colsProp),
    [rawAmenities, primaryColor, headingProp, colsProp]
  );

  const [query, setQuery] = useState("");

  // normalize color: hex => inline style; else leave empty for CSS class usage
  const isHex = typeof color === "string" && color.trim().startsWith("#");
  const accentBgTranslucent = isHex ? { background: `${color}22` } : {};

  // filter amenities by search query
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

  // responsive grid classes
  const gridColsClass =
    cols === 4 ? "lg:grid-cols-4 md:grid-cols-3" : cols === 2 ? "md:grid-cols-2 lg:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm text-slate-500">Premium lifestyle & conveniences designed for modern living.</p>
        </div>

        {/* optional search */}
        <div className="w-full sm:w-auto">
          <label className="sr-only">Search amenities</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search amenities..."
            className="w-full sm:w-64 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
          />
        </div>
      </div>

      <div className={`grid gap-6 ${gridColsClass}`}>
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg p-8 text-center border border-slate-100 shadow-sm">
            <div className="text-sm text-slate-500">No amenities match your search.</div>
          </div>
        ) : (
          filtered.map((a, idx) => {
            const key = a.key ?? a.title ?? `amenity-${idx}`;
            return (
              <article
                key={key}
                className="relative group flex gap-4 items-start p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1"
                role="article"
              >
                {/* icon / image */}
                <div
                  className="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center"
                  style={{
                    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                    ...accentBgTranslucent,
                  }}
                >
                  <img
                    src={a.imageUrl ?? DEV_FALLBACK_IMAGE}
                    alt={a.title ?? "amenity"}
                    className="h-10 w-10 object-cover rounded-md"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (t.src !== DEV_FALLBACK_IMAGE) t.src = DEV_FALLBACK_IMAGE;
                    }}
                  />
                </div>

                {/* content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold leading-tight text-slate-900">{a.title}</h3>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{a.description}</p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
