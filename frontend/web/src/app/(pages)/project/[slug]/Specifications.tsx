"use client";

import { useMemo, useState } from "react";
import { FeaturedProject } from "@/types";

type SpecificationsProps = {
  project: FeaturedProject;
};

type Specification = NonNullable<FeaturedProject["specifications"]>[number];
type SpecificationItem = {
  title: string;
  description: string;
};

export default function Specifications({ project }: SpecificationsProps) {
  const specifications = useMemo(
    () =>
      [...(project.specifications ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [project.specifications],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (!specifications.length) {
    return null;
  }

  const activeSpec = specifications[activeIndex] ?? specifications[0];

  return (
    <section id="specifications">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            Specifications
          </h2>

          <div className="px-4 py-4 sm:px-5">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] sm:gap-3 sm:pb-4 [&::-webkit-scrollbar]:hidden">
              {specifications.map((spec: Specification, index) => (
                <button
                  key={`${spec.category}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`shrink-0 rounded-md border px-4 py-2 text-xs font-medium transition sm:px-5 sm:py-2.5 sm:text-sm ${activeIndex === index
                      ? "border-emerald-500 bg-[#27ae60] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                  {spec.category}
                </button>
              ))}
            </div>

            <div className="grid gap-x-16 gap-y-3 pt-4 md:grid-cols-2 md:gap-y-4 md:pt-5">
              {(activeSpec.items as SpecificationItem[] | undefined)?.map((item, index) => (
                <p key={`${item.title}-${index}`} className="text-sm leading-6 text-slate-500 sm:leading-7">
                  <span className="block font-medium text-slate-950 sm:inline">{item.title}</span>
                  <span className="hidden sm:inline"> - </span>
                  <span>{item.description}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
