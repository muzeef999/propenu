// components/AboutUS.tsx
"use client";

import React, { useMemo } from "react";

export type AboutItem = {
  aboutDescription?: string;
  url?: string; // image URL
  rightContent?: string; // newline-separated bullets or lines starting with •
  filename?: string;
  key?: string;
  mimetype?: string;
};

/**
 * Accept either:
 *  - an array: aboutSummary={AboutItem[]}
 *  - a payload object: aboutSummary={{ aboutSummary: AboutItem[], color?: string, heading?: string }}
 */
type AboutPropPayload = {
  aboutSummary?: AboutItem[] | null;
  color?: string | null;
  heading?: string | null;
};

type Props = {
  aboutSummary?: AboutItem[] | AboutPropPayload | null;
  primaryColor?: string | null; // optional explicit override
  heading?: string | null;
};

const DEFAULT_COLOR = "#F59E0B";

/** normalize shapes */
function normalizeAboutProp(
  incoming?: AboutItem[] | AboutPropPayload | null,
  explicitColor?: string | null,
  explicitHeading?: string | null
) {
  if (Array.isArray(incoming)) {
    return {
      items: incoming as AboutItem[],
      color: explicitColor ?? DEFAULT_COLOR,
      heading: explicitHeading ?? "About Us",
    };
  }
  const payload = (incoming || {}) as AboutPropPayload;
  return {
    items: Array.isArray(payload.aboutSummary) ? payload.aboutSummary : [],
    color: explicitColor ?? payload.color ?? DEFAULT_COLOR,
    heading: explicitHeading ?? payload.heading ?? "About Us",
  };
}

/** split rightContent into bullet lines (handles newlines and leading bullet char) */
function splitBullets(text?: string) {
  if (!text) return [] as string[];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[\u2022•\-\*]\s?/, "")); // remove bullet char if present
}

export default function AboutUS(props: Props) {
  const { aboutSummary: raw, primaryColor, heading: headingProp } = props;
  const { items, color, heading } = useMemo(() => normalizeAboutProp(raw, primaryColor ?? null, headingProp ?? null), [
    raw,
    primaryColor,
    headingProp,
  ]);

  const item = items && items.length > 0 ? items[0] : undefined;
  const bullets = useMemo(() => splitBullets(item?.rightContent), [item?.rightContent]);

  // safe url decode only if it looks encoded, else use as-is
  const safeUrl = item?.url ? (() => {
    try {
      // decodeURIComponent can throw if not properly encoded; guard it
      const decoded = decodeURIComponent(item.url);
      // if decode gives same string or seems plausible, return decoded; else original
      return decoded || item.url;
    } catch {
      return item.url;
    }
  })() : undefined;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
     <div className="mb-6 flex items-start justify-between gap-6">
         <div  style={{color:color, borderLeft:`5px solid ${color}`}}>
              <div className="ml-2">
            <h1 className="text-2xl font-bold">
              About US
            </h1>
            <p className="headingDesc">
             Building excellence in Hyderabad
            </p>
          </div>
          </div>
      </div>

      {item?.aboutDescription ? (
        <p className="mt-6 text-gray-700 text-base sm:text-lg leading-relaxed">{item.aboutDescription}</p>
      ) : null}

      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mt-6">
        {/* Left: image */}
        <div className="lg:w-2/3 w-full">
          {safeUrl ? (
            <div className="mt-0 ">
              {/* use native img for external URLs; can switch to next/image if configured */}
              <img
                src={safeUrl}
                alt={item?.filename ?? "About image"}
                className="w-full rounded-2xl shadow-lg object-cover h-56 sm:h-72 md:h-80 lg:h-64"
                loading="lazy"
                onError={(e) => {
                  // fallback to hidden placeholder if image fails
                  const t = e.currentTarget as HTMLImageElement;
                  t.onerror = null;
                  t.style.display = "none";
                }}
              />
            </div>
          ) : (
            // optional placeholder if no url
            <div className="mt-4 w-full rounded-2xl bg-gray-50 border border-dashed border-gray-200 h-56 flex items-center justify-center text-gray-400">
              No image provided
            </div>
          )}
        </div>

        {/* Right: bullet list */}
        
        <aside className="lg:w-1/3 w-full flex-shrink-0">
          <div className="bg-white/0">
            <ul className="space-y-4">
              {bullets.length ? (
                bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-1" aria-hidden>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="5" cy="5" r="5" fill={color} />
                      </svg>
                    </span>
                    <p className="text-gray-700 text-sm leading-snug">{b}</p>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">No features listed.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
