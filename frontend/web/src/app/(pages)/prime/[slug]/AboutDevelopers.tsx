"use client";

import React from "react";

type ContactLike = {
  name?: string;
  fullName?: string;
  companyName?: string;
};

type AboutItem = {
  aboutDescription?: string;
};

type Props = {
  logoUrl?: string;
  developer?: ContactLike | string | null;
  createdBy?: ContactLike | string | null;
  description?: string;
  aboutSummary?: AboutItem[] | null;
  color?: string | null;
};

function isContactObject(value: unknown): value is ContactLike {
  return Boolean(value) && typeof value === "object";
}

function stripHtml(text?: string) {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function AboutDevelopers({
  logoUrl,
  developer,
  createdBy,
  description,
  aboutSummary,
  color,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);

  const developerName =
    (isContactObject(developer)
      ? developer.companyName || developer.name || developer.fullName
      : typeof developer === "string"
        ? developer
        : "") ||
    (isContactObject(createdBy)
      ? createdBy.companyName || createdBy.name || createdBy.fullName
      : typeof createdBy === "string"
        ? createdBy
        : "") ||
    "Propenu pvt.ltd";

  const rawDescription =
    description ||
    aboutSummary?.[0]?.aboutDescription ||
    `Your home is a reflection of your personality and style. We take great pride in helping homeowners create spaces that feel thoughtful, refined, and complete from design to final finish.`;

  const cleanDescription = stripHtml(rawDescription);
  const truncatedDescription =
    cleanDescription.length > 180
      ? `${cleanDescription.slice(0, 180).trimEnd()}...`
      : cleanDescription;

  const displayDescription = expanded ? cleanDescription : truncatedDescription;
  const showToggle = cleanDescription.length > 180;
  const accentColor = color?.trim() || "#F59E0B";

  return (
    <section className="w-full">
      <div style={{ color: color, borderLeft: `5px solid ${color}` }}>
        <div className="ml-2">
          <h1 className="text-[20px] font-bold lg:text-2xl md:text-4xl">
            About the Developers - {developerName}
          </h1>
         
        </div>
      </div>
      <br />

      <div className="mt-6 flex w-full flex-col items-start gap-5 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex h-14 w-28 shrink-0 items-center justify-start sm:h-16 sm:w-32">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${developerName} logo`}
              className="h-full w-full object-contain object-left"
            />
          ) : (
            <span className="text-sm font-semibold text-sky-600">
              {developerName.charAt(0)}
            </span>
          )}
        </div>

        <p className="max-w-5xl text-sm leading-7 text-[#2A2A2A] sm:text-base">
          {displayDescription}
          {showToggle ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="ml-1 cursor-pointer font-medium"
              style={{ color: accentColor }}
            >
              {expanded ? "less" : "more"}
            </button>
          ) : null}
        </p>
      </div>
    </section>
  );
}
