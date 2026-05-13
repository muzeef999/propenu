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
          <h2 className="border-b border-slate-200 px-5 py-5 text-xl font-medium text-slate-950">
            Specifications
          </h2>

          <div className="px-5 py-4">
            <div className="flex gap-3 overflow-x-auto border-b border-slate-200 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {specifications.map((spec: Specification, index) => (
                <button
                  key={`${spec.category}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`shrink-0 rounded-md border px-5 py-2.5 text-sm font-medium transition ${activeIndex === index
                      ? "border-emerald-500 bg-[#27ae60] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                  {spec.category}
                </button>
              ))}
            </div>

            <div className="grid gap-x-16 gap-y-4 pt-5 md:grid-cols-2">
              {(activeSpec.items as SpecificationItem[] | undefined)?.map((item, index) => (
                <p key={`${item.title}-${index}`} className="text-sm leading-7 text-slate-500">
                  <span className="font-medium text-slate-950">{item.title}</span>
                  {" - "}
                  {item.description}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
