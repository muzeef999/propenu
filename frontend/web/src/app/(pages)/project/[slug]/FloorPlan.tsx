"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";
import { FeaturedProject, IBhkUnit } from "@/types";

type FloorPlanProps = {
  project: FeaturedProject;
};

type PlanGroup = {
  label: string;
  bhkLabel: string;
  units: IBhkUnit[];
};

const MIN_PLAN_ZOOM = 1;
const MAX_PLAN_ZOOM = 2.5;
const PLAN_ZOOM_STEP = 0.25;

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

function normalizeAreaUnit(unit?: string) {
  const normalized = unit?.trim().toLowerCase();

  if (!normalized || ["sqft", "sq.ft", "sq ft", "square feet", "square foot"].includes(normalized)) {
    return "sq.ft";
  }

  if (["gunta", "guntas", "guntha", "gunthas"].includes(normalized)) {
    return "guntas";
  }

  return unit?.trim() || "sq.ft";
}

function getUnitAreaForRate(unit?: IBhkUnit, isLand = false) {
  if (isLand && typeof unit?.area?.value === "number" && Number.isFinite(unit.area.value) && unit.area.value > 0) {
    return {
      value: unit.area.value,
      unit: normalizeAreaUnit(unit.area.unit),
    };
  }

  if (typeof unit?.area?.sqftValue === "number" && Number.isFinite(unit.area.sqftValue) && unit.area.sqftValue > 0) {
    return {
      value: unit.area.sqftValue,
      unit: "sq.ft",
    };
  }

  if (typeof unit?.area?.value === "number" && Number.isFinite(unit.area.value) && unit.area.value > 0) {
    return {
      value: unit.area.value,
      unit: normalizeAreaUnit(unit.area.unit),
    };
  }

  if (typeof unit?.minSqft === "number" && Number.isFinite(unit.minSqft) && unit.minSqft > 0) {
    return {
      value: unit.minSqft,
      unit: "sq.ft",
    };
  }

  return null;
}

function formatPricePerUnit(unit?: IBhkUnit, isLand = false) {
  const minPrice = unit?.minPrice ?? unit?.price;
  const area = getUnitAreaForRate(unit, isLand);

  if (typeof minPrice !== "number" || !Number.isFinite(minPrice) || minPrice <= 0 || !area) {
    return null;
  }

  return `\u20b9 ${Math.round(minPrice / area.value).toLocaleString("en-IN")}/${area.unit}`;
}

function getComparableArea(unit?: IBhkUnit) {
  const areaValue =
    unit?.area?.sqftValue ??
    unit?.minSqft ??
    unit?.area?.value ??
    Number.MAX_SAFE_INTEGER;

  return typeof areaValue === "number" && Number.isFinite(areaValue)
    ? areaValue
    : Number.MAX_SAFE_INTEGER;
}

function getComparableGroupValue(group: PlanGroup) {
  const value = group.bhkLabel.match(/\d+(\.\d+)?/)?.[0];
  const numericValue = value ? Number(value) : Number.MAX_SAFE_INTEGER;

  return Number.isFinite(numericValue) ? numericValue : Number.MAX_SAFE_INTEGER;
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
        units: [...(item.units ?? [])].sort(
          (a, b) => getComparableArea(a) - getComparableArea(b),
        ),
      };
    })
    .filter((group) => group.units.length > 0)
    .sort((a, b) => {
      const groupSort = getComparableGroupValue(a) - getComparableGroupValue(b);

      if (groupSort !== 0) return groupSort;

      return a.label.localeCompare(b.label);
    });
}

export default function FloorPlan({ project }: FloorPlanProps) {
  const groups = useMemo(() => getPlanGroups(project), [project]);
  const planScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({
    clientX: 0,
    clientY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  const [planZoom, setPlanZoom] = useState(MIN_PLAN_ZOOM);
  const [isDraggingPlan, setIsDraggingPlan] = useState(false);
  const isLand = project.categoryType?.toLowerCase() === "land";
  const sectionTitle = isLand ? "Layout" : "Floor Plans";

  const activeGroup = groups[activeGroupIndex];
  const activeUnit = activeGroup?.units[activeUnitIndex] ?? activeGroup?.units[0];
  const planImage = activeUnit?.plan?.url;
  const sqftLabel = formatUnitArea(activeUnit, isLand);
  const priceLabel = formatCompactPrice(activeUnit?.minPrice ?? activeUnit?.price);
  const pricePerUnitLabel = formatPricePerUnit(activeUnit, isLand);
  const canZoomIn = planZoom < MAX_PLAN_ZOOM;
  const canZoomOut = planZoom > MIN_PLAN_ZOOM;
  const canDragPlan = planZoom > MIN_PLAN_ZOOM;

  useEffect(() => {
    setPlanZoom(MIN_PLAN_ZOOM);
    if (planScrollRef.current) {
      planScrollRef.current.scrollLeft = 0;
      planScrollRef.current.scrollTop = 0;
    }
  }, [activeGroupIndex, activeUnitIndex]);

  const zoomPlan = (direction: "in" | "out") => {
    setPlanZoom((currentZoom) => {
      const nextZoom =
        direction === "in"
          ? currentZoom + PLAN_ZOOM_STEP
          : currentZoom - PLAN_ZOOM_STEP;

      return Math.min(MAX_PLAN_ZOOM, Math.max(MIN_PLAN_ZOOM, nextZoom));
    });
  };

  const handlePlanPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canDragPlan || !planScrollRef.current) return;

    const scroller = planScrollRef.current;
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      scrollLeft: scroller.scrollLeft,
      scrollTop: scroller.scrollTop,
    };

    setIsDraggingPlan(true);
    scroller.setPointerCapture(event.pointerId);
  };

  const handlePlanPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPlan || !planScrollRef.current) return;

    event.preventDefault();

    const scroller = planScrollRef.current;
    const dragStart = dragStartRef.current;
    scroller.scrollLeft = dragStart.scrollLeft - (event.clientX - dragStart.clientX);
    scroller.scrollTop = dragStart.scrollTop - (event.clientY - dragStart.clientY);
  };

  const stopPlanDrag = () => {
    setIsDraggingPlan(false);
  };

  if (!groups.length) {
    return null;
  }
  return (
    <section id="floor-plans" className="min-w-0">
      <div className="container mx-auto min-w-0 px-1 sm:px-4 lg:px-3">
        <div className="w-full min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            {project.title} {sectionTitle}
          </h2>

          <div className="min-w-0 px-4 py-4 sm:px-5">
            <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 sm:gap-4 ">
              {groups.map((group, index) => (
                <button
                  key={`${group.label}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveGroupIndex(index);
                    setActiveUnitIndex(0);
                  }}
                  className={`shrink-0 rounded-md px-4 py-2.5 text-xs font-medium transition sm:px-5 sm:py-3 sm:text-sm cursor-pointer ${
                    activeGroupIndex === index
                      ? "bg-emerald-50 text-slate-950"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <div className="no-scrollbar mt-4 flex w-full min-w-0 max-w-full overflow-x-auto border-b border-slate-200">
              {activeGroup.units.map((unit, index) => (
                <button
                  key={`${unit.minSqft}-${unit.price}-${index}`}
                  type="button"
                  onClick={() => setActiveUnitIndex(index)}
                  className={`shrink-0 border-b-2 px-5 pb-3 text-center transition sm:px-8 cursor-pointer ${
                    activeUnitIndex === index
                      ? "border-emerald-500"
                      : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`block whitespace-nowrap text-xs font-medium ${
                      activeUnitIndex === index ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {formatUnitArea(unit, isLand)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 min-w-0 rounded-md p-1">
              {planImage ? (
                <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div
                    ref={planScrollRef}
                    onPointerDown={handlePlanPointerDown}
                    onPointerMove={handlePlanPointerMove}
                    onPointerUp={stopPlanDrag}
                    onPointerCancel={stopPlanDrag}
                    onPointerLeave={stopPlanDrag}
                    className={`flex h-[260px] items-center justify-center overflow-auto select-none sm:h-[420px] ${
                      canDragPlan
                        ? isDraggingPlan
                          ? "cursor-grabbing"
                          : "cursor-grab"
                        : "cursor-default"
                    }`}
                  >
                    <img
                      src={planImage}
                      alt={`${activeGroup.bhkLabel} floor plan`}
                      draggable={false}
                      className="max-w-none object-contain transition-[height,width] duration-200 ease-out"
                      style={{
                        width: `${planZoom * 100}%`,
                        height: `${planZoom * 100}%`,
                      }}
                    />
                  </div>

                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm">
                    <button
                      type="button"
                      aria-label="Zoom out plan"
                      onClick={() => zoomPlan("out")}
                      disabled={!canZoomOut}
                      className="flex h-8 w-8 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <FiMinus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Reset plan zoom"
                      onClick={() => setPlanZoom(MIN_PLAN_ZOOM)}
                      className="h-8 min-w-12 rounded px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {Math.round(planZoom * 100)}%
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in plan"
                      onClick={() => zoomPlan("in")}
                      disabled={!canZoomIn}
                      className="flex h-8 w-8 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <FiPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 text-center sm:min-h-[420px]">
                  <p className="text-sm font-medium text-slate-500">
                    Floor plan image coming soon
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-950 sm:text-base">
                  {activeGroup.bhkLabel} {sqftLabel}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <p className="text-lg font-semibold text-emerald-600 sm:text-xl">{priceLabel}</p>
                  {pricePerUnitLabel && (
                    <p className="text-sm font-semibold text-slate-600 sm:text-base">{pricePerUnitLabel}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded btn-primary px-10 py-3 text-sm font-semibold text-white shadow-sm transition sm:w-auto sm:min-w-56"
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
