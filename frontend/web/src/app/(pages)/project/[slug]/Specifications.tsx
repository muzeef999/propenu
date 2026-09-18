"use client";

import { useMemo } from "react";
import { FeaturedProject } from "@/types";

type SpecificationsProps = {
  project: FeaturedProject;
};

type SpecificationItem = {
  title: string;
  description: string;
};

function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function sanitizeStyleAttribute(styles: string) {
  const textAlign = styles.match(
    /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*;?/i,
  );
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

function formatSpecificationDescription(description: string) {
  return description
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(
      /\s*(?=(?:Structure|Super structure|Plastering|Painting|Flooring|Doors|Windows|Kitchen|Toilets|Electrical system|Common Area|Railings|Bedroom and kitchen|Utility \/ Wash Area|Ceiling|Internal|External|Main Door|Internal Door|Windows frame and shutter|Utility areas|Drawing, Dinning, living and foyer|Balcony|Staircase):)/g,
      "\n",
    )
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export default function Specifications({ project }: SpecificationsProps) {
  const specifications = useMemo(
    () =>
      [...(project.specifications ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [project.specifications],
  );
  const descriptions = useMemo(
    () =>
      specifications
        .flatMap((spec) => spec.items ?? [])
        .map((item) => {
          const raw = (item as SpecificationItem).description?.trim() ?? "";
          if (!raw) return null;
          if (looksLikeHtml(raw)) {
            return { kind: "html" as const, value: sanitizeRichText(raw) };
          }
          return {
            kind: "text" as const,
            value: formatSpecificationDescription(raw),
          };
        })
        .filter(
          (
            row,
          ): row is { kind: "html" | "text"; value: string } =>
            Boolean(row?.value),
        ),
    [specifications],
  );

  if (!specifications.length || !descriptions.length) {
    return null;
  }
  return (
    <section id="specifications">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            Specifications
          </h2>

          <div className="px-4 py-4 sm:px-5">
            <div className="max-h-[420px] overflow-y-auto rounded-md border border-slate-200 bg-white p-4 sm:max-h-[460px] sm:p-5">
              {descriptions.map((row, index) =>
                row.kind === "html" ? (
                  <div
                    key={`html-${index}`}
                    className="prose prose-sm mb-3 max-w-none text-slate-600 last:mb-0 sm:prose-base prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: row.value }}
                  />
                ) : (
                  <p
                    key={`text-${index}`}
                    className="mb-3 whitespace-pre-line text-sm leading-7 text-slate-600 last:mb-0 sm:text-base sm:leading-8"
                  >
                    {row.value}
                  </p>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
