"use client";

import { useState } from "react";
import { FeaturedProject } from "@/types";

type AboutProjectProps = {
  project: FeaturedProject;
};

function stripHtml(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeStyleAttribute(styles: string) {
  const textAlign = styles.match(/(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*;?/i);

  return textAlign ? ` style="text-align: ${textAlign[1].toLowerCase()};"` : "";
}

function sanitizeRichText(value?: string) {
  if (!value) return "";

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "")
    .replace(/\sstyle\s*=\s*(["'])(.*?)\1/gi, (_, __, styles) =>
      sanitizeStyleAttribute(styles),
    )
    .trim();
}

export default function AboutProject({ project }: AboutProjectProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const about = project.aboutSummary?.[0];
  const imageUrl = about?.url || project.heroImage || project.gallerySummary?.[0]?.url;
  const richDescription = sanitizeRichText(about?.rightContent || about?.aboutDescription);
  const plainDescription =
    project.heroDescription ||
    project.metaDescription ||
    "";
  const descriptionText = stripHtml(richDescription) || plainDescription;
  const canToggleDescription = descriptionText.length > 280;

  if (!descriptionText && !imageUrl) {
    return null;
  }

  return (
    <section id="about-project" className="scroll-mt-20">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            About Project
          </h2>

          <div
  className={`grid gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 ${
    imageUrl && !isExpanded
      ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      : "grid-cols-1"
  }`}
>
  {imageUrl && (
    <div className={isExpanded ? "flex justify-center" : ""}>
      <img
        src={imageUrl}
        alt={`${project.title} overview`}
        className={`rounded-md object-cover ${
          isExpanded
            ? "h-56 w-full max-w-2xl sm:h-72 md:h-[360px]"
            : "h-40 w-full sm:h-44 md:h-[200px]"
        }`}
      />
    </div>
  )}

  <div className="space-y-4 text-sm leading-6 text-slate-500 sm:text-base">
    {descriptionText ? (
      <>
        {richDescription ? (
          <div
            className={`space-y-3 [&_a]:text-emerald-700 [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:leading-7 [&_h1]:text-slate-950 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h3]:font-semibold [&_h3]:text-slate-950 [&_mark]:rounded-sm [&_mark]:bg-yellow-100 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-slate-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 ${
              isExpanded ? "" : "line-clamp-8 sm:line-clamp-6"
            }`}
            dangerouslySetInnerHTML={{ __html: richDescription }}
          />
        ) : (
          <p className={isExpanded ? "" : "line-clamp-8 sm:line-clamp-6"}>
            {plainDescription}
          </p>
        )}

        {canToggleDescription && (
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            {isExpanded ? "View less" : "View more"}
          </button>
        )}
      </>
    ) : (
      <p>Project details coming soon.</p>
    )}
  </div>
</div>
        </div>
      </div>
    </section>
  );
}
