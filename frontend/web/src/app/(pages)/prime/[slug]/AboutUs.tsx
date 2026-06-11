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
const RICH_TEXT_CLASSES =
  "text-gray-700 leading-relaxed " +
  "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mb-3 " +
  "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:mb-3 " +
  "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 " +
  "[&_p]:mb-3 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:mb-2";

/** normalize shapes */
function normalizeAboutProp(
  incoming?: AboutItem[] | AboutPropPayload | null,
  explicitColor?: string | null,
  explicitHeading?: string | null,
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

function isHtmlContent(text?: string) {
  if (!text) return false;
  return /<[^>]+>/.test(text);
}

export default function AboutUS(props: Props) {
  const { aboutSummary: raw, primaryColor, heading: headingProp } = props;
  const [imageFailed, setImageFailed] = React.useState(false);
  const { items, color, heading } = useMemo(
    () => normalizeAboutProp(raw, primaryColor ?? null, headingProp ?? null),
    [raw, primaryColor, headingProp],
  );

  const item = items && items.length > 0 ? items[0] : undefined;
  const bullets = useMemo(
    () => splitBullets(item?.rightContent),
    [item?.rightContent],
  );
  const hasHtmlDescription = isHtmlContent(item?.aboutDescription);
  const hasHtmlRightContent = isHtmlContent(item?.rightContent);

  const imageUrl = item?.url?.trim();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div style={{ color: color, borderLeft: `5px solid ${color}` }}>
          <div className="ml-2">
            <h1 className="text-2xl font-bold">{heading}</h1>
            <p className="headingDesc">The story behind the project</p>
          </div>
        </div>
      </div>

      {item?.aboutDescription ? (
        hasHtmlDescription ? (
          <div
            className={`mt-6 text-base sm:text-base ${RICH_TEXT_CLASSES}`}
            dangerouslySetInnerHTML={{ __html: item.aboutDescription }}
          />
        ) : (
          <p className="mt-6 text-gray-700 text-base sm:text-lg leading-relaxed">
            {item.aboutDescription}
          </p>
        )
      ) : null}

      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 mt-6">
        {/* Left: image */}
        <div className="lg:w-2/3 w-full">
          {imageUrl && !imageFailed ? (
            <div className="w-full overflow-hidden rounded-2xl shadow-lg">
              <img
                src={imageUrl}
                alt={item?.filename ?? "About image"}
                className="h-56 w-full object-cover sm:h-72 md:h-80 lg:h-[420px]"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  setImageFailed(true);
                }}
              />
            </div>
          ) : (
            <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 sm:h-72 md:h-80 lg:h-[420px]">
              Image not available
            </div>
          )}
        </div>

        {/* Right: bullet list */}

        <aside className="lg:w-1/3 w-full shrink-0">
          <div className="bg-white/0">
            {hasHtmlRightContent && item?.rightContent ? (
              <div
                className={`text-sm ${RICH_TEXT_CLASSES}`}
                dangerouslySetInnerHTML={{ __html: item.rightContent }}
              />
            ) : (
              <ul className="space-y-4">
                {bullets.length ? (
                  bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="shrink-0 mt-1" aria-hidden>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
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
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
