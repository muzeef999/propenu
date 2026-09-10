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

function isValidDeveloperName(name?: string | null): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  // If it's a 24-character hexadecimal MongoDB ObjectId, don't show it as developer name
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return false;
  if (trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") return false;
  return true;
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

  const rawDeveloperName =
    (isContactObject(developer)
      ? developer.companyName || developer.name || developer.fullName
      : typeof developer === "string"
        ? developer
        : "") ||
    (isContactObject(createdBy)
      ? createdBy.companyName || createdBy.name || createdBy.fullName
      : typeof createdBy === "string"
        ? createdBy
        : "");

  const developerName = isValidDeveloperName(rawDeveloperName)
    ? rawDeveloperName.trim()
    : "";

  const title = developerName
    ? `About the Developers - ${developerName}`
    : "About the Developers";

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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div style={{ color: accentColor, borderLeft: `5px solid ${accentColor}` }}>
          <div className="ml-2">
            <h1 className="text-[20px] font-bold lg:text-2xl md:text-4xl">
              {title}
            </h1>
            <p className="headingDesc text-xs lg:text-base md:text-lg">
              The visionary team behind the project
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col items-start gap-5 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex h-14 w-28 shrink-0 items-center justify-start sm:h-16 sm:w-32">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${developerName || "Developer"} logo`}
              className="h-full w-full object-contain object-left"
            />
          ) : (
            <span className="text-sm font-semibold text-sky-600">
              {(developerName || "P").charAt(0)}
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
