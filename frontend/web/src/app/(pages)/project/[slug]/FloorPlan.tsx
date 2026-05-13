"use client";

import { useMemo, useState } from "react";
import { FeaturedProject, IBhkUnit } from "@/types";

type FloorPlanProps = {
  project: FeaturedProject;
};

type PlanGroup = {
  label: string;
  bhkLabel: string;
  units: IBhkUnit[];
};

function formatCompactPrice(price?: number) {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return "--";
  }

  if (price >= 1e7) {
    return `\u20b9 ${(price / 1e7).toFixed(2).replace(/\.00$/, "")} Cr`;
  }

  if (price >= 1e5) {
    return `\u20b9 ${(price / 1e5).toFixed(2).replace(/\.00$/, "")} L`;
  }

  return `\u20b9 ${price.toLocaleString("en-IN")}`;
}

function formatUnitArea(unit?: IBhkUnit, isLand = false) {
  if (isLand) {
    const areaValue = unit?.area?.value;
    const areaUnit = unit?.area?.unit;

    if (
      typeof areaValue === "number" &&
      Number.isFinite(areaValue) &&
      areaValue > 0
    ) {
      return `${areaValue} ${areaUnit || "sq.ft"}`;
    }
  }

  if (
    typeof unit?.minSqft === "number" &&
    Number.isFinite(unit.minSqft) &&
    unit.minSqft > 0
  ) {
    return `${unit.minSqft} sq.ft`;
  }

  return "--";
}

function getPlanGroups(project: FeaturedProject): PlanGroup[] {
  const summary = project.projectSummary ?? project.bhkSummary ?? [];

  return summary
    .map((item) => {
      const label = item.label ?? item.bhkLabel ?? `${item.bhk} BHK`;
      const cleanLabel = label.toLowerCase().includes("apartment")
        ? label
        : `${label} `;

      return {
        label: cleanLabel,
        bhkLabel: label,
        units: item.units ?? [],
      };
    })
    .filter((group) => group.units.length > 0);
}

export default function FloorPlan({ project }: FloorPlanProps) {
  const groups = useMemo(() => getPlanGroups(project), [project]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  const isLand = project.categoryType?.toLowerCase() === "land";
  const sectionTitle = isLand ? "Layout" : "Floor Plans";

  const activeGroup = groups[activeGroupIndex];
  const activeUnit = activeGroup?.units[activeUnitIndex] ?? activeGroup?.units[0];
  const planImage = activeUnit?.plan?.url;
  const sqftLabel = formatUnitArea(activeUnit, isLand);
  const priceLabel = formatCompactPrice(activeUnit?.price ?? activeUnit?.maxPrice);

  if (!groups.length) {
    return null;
  }

  return (
    <section id="floor-plans">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-5 py-5 text-xl font-medium text-slate-950">
            {project.title} {sectionTitle}
          </h2>

          <div className="px-5 py-4">
            <div className="flex gap-4 overflow-x-auto pb-1">
              {groups.map((group, index) => (
                <button
                  key={`${group.label}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveGroupIndex(index);
                    setActiveUnitIndex(0);
                  }}
                  className={`shrink-0 rounded-md px-5 py-3 text-sm font-medium transition ${
                    activeGroupIndex === index
                      ? "bg-emerald-50 text-slate-950"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-7 overflow-x-auto border-b border-slate-200">
              {activeGroup.units.map((unit, index) => (
                <button
                  key={`${unit.minSqft}-${unit.price}-${index}`}
                  type="button"
                  onClick={() => setActiveUnitIndex(index)}
                  className={`shrink-0 border-b-2 pb-2 text-left transition ${
                    activeUnitIndex === index
                      ? "border-emerald-500"
                      : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <span className="block text-xs text-slate-500">
                    {formatUnitArea(unit, isLand)}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-950">
                    {formatCompactPrice(unit.price ?? unit.maxPrice)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6">
              {planImage ? (
                <img
                  src={planImage}
                  alt={`${activeGroup.bhkLabel} floor plan`}
                  className="max-h-[380px] w-full object-contain"
                />
              ) : (
                <p className="text-sm font-medium text-slate-500">
                  Floor plan image coming soon
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-medium text-slate-950">
                  {activeGroup.bhkLabel} {sqftLabel}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <p className="text-xl font-semibold text-emerald-600">{priceLabel}</p>
                  <p className="text-xs text-slate-500">Ready to move</p>
                  <p className="text-xs text-slate-500">
                    {project.possessionDate
                      ? `${new Date(project.possessionDate).toLocaleString("en-US", {
                          month: "short",
                          year: "2-digit",
                        })} Possession`
                      : "Possession on request"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded btn-primary px-10 py-3 text-sm font-semibold text-white shadow-sm transition sm:min-w-56"
              >
                Request Callback
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
