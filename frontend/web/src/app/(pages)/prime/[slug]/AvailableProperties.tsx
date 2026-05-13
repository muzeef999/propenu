// components/AvailableProperties.tsx
"use client";

import { hexToRGBA } from "@/ui/hexToRGBA";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

type Unit = {
  minSqft?: number;
  maxPrice?: number;
  availableCount?: number;
  area?: {
    value?: number;
    unit?: string;
    sqftValue?: number;
  };
  plan?: { url?: string };
};

type BhkItem = {
  bhk: number;
  label?: string;
  bhkLabel?: string;
  units?: Unit[];
};

type BhkPayload = {
  projectSummary?: BhkItem[] | null;
  bhkSummary?: BhkItem[] | null;
  categoryType?: string | null;
  propertyType?: string | null;
  color?: string | null;
  reraNumber?: string | null;
};

type Props = {
  bhk?: BhkPayload | null;
};

// fallback image — replace with a public asset or import if available
const DEV_PLAN_URL = "/images/placeholder.jpg";
const MIN_PLAN_ZOOM = 1;
const MAX_PLAN_ZOOM = 2.5;
const PLAN_ZOOM_STEP = 0.25;

function formatAreaUnit(unit?: Unit, isLand = false) {
  if (isLand) {
    const areaValue = unit?.area?.value;
    const areaUnit = unit?.area?.unit;

    if (
      typeof areaValue === "number" &&
      Number.isFinite(areaValue) &&
      areaValue > 0
    ) {
      return `${areaValue} ${areaUnit || "sqft"}`;
    }
  }

  if (
    typeof unit?.minSqft === "number" &&
    Number.isFinite(unit.minSqft) &&
    unit.minSqft > 0
  ) {
    return `${unit.minSqft} sqft`;
  }

  return "—";
}

/** small helper to format INR numbers */
function formatINR(v?: number) {
  if (v === undefined || v === null) return "--";
  try {
    return v.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  } catch {
    return String(v);
  }
}

export default function AvailableProperties({ bhk }: Props) {
  const planScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({
    clientX: 0,
    clientY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const items: BhkItem[] = Array.isArray(bhk?.projectSummary)
    ? bhk!.projectSummary!
    : Array.isArray(bhk?.bhkSummary)
      ? bhk!.bhkSummary!
      : [];
  const color = (bhk?.color ?? "#F59E0B") as string;
  const reraNumber = bhk?.reraNumber ?? "--";
  const category = `${bhk?.categoryType ?? bhk?.propertyType ?? ""}`.toLowerCase();
  const isLand = category === "land";
  const showFlatLabel = !isLand;

  // default to first BHK group
  const [activeBhkIndex, setActiveBhkIndex] = useState<number>(0);
  // default to first unit within selected BHK
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(0);
  const [planZoom, setPlanZoom] = useState<number>(MIN_PLAN_ZOOM);
  const [isDraggingPlan, setIsDraggingPlan] = useState(false);

  // clamp indices when items length changes
  useEffect(() => {
    if (activeBhkIndex >= items.length && items.length > 0) {
      setActiveBhkIndex(0);
    }
    if (items.length === 0) {
      setActiveBhkIndex(0);
      setActiveUnitIndex(0);
    }
  }, [items.length, activeBhkIndex]);

  // reset unit index when BHK changes
  useEffect(() => {
    setActiveUnitIndex(0);
  }, [activeBhkIndex]);

  useEffect(() => {
    setPlanZoom(MIN_PLAN_ZOOM);
  }, [activeBhkIndex, activeUnitIndex]);

  const activeBhk = items[activeBhkIndex] ?? null;
  const units = Array.isArray(activeBhk?.units) ? activeBhk!.units! : [];

  // clamp activeUnit when units length changes
  useEffect(() => {
    if (activeUnitIndex >= units.length && units.length > 0) {
      setActiveUnitIndex(0);
    }
    if (units.length === 0) {
      setActiveUnitIndex(0);
    }
  }, [units.length, activeUnitIndex]);

  // readable sqft labels for chips
  const sqftLabels = useMemo(
    () =>
      units.map((u) => {
        const areaLabel = formatAreaUnit(u, isLand);
        return areaLabel !== "—" ? areaLabel : u.plan?.url ? "Plan" : "—";
      }),
    [units, isLand]
  );

  const activeUnit = units[activeUnitIndex];
  const canZoomIn = planZoom < MAX_PLAN_ZOOM;
  const canZoomOut = planZoom > MIN_PLAN_ZOOM;
  const canDragPlan = planZoom > MIN_PLAN_ZOOM;

  const zoomPlan = (direction: "in" | "out") => {
    setPlanZoom((currentZoom) => {
      const nextZoom =
        direction === "in"
          ? currentZoom + PLAN_ZOOM_STEP
          : currentZoom - PLAN_ZOOM_STEP;

      return Math.min(MAX_PLAN_ZOOM, Math.max(MIN_PLAN_ZOOM, nextZoom));
    });
  };

  const handlePlanPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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

  const handlePlanPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
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

  function scrollToHero() {
    const el = document.querySelector('[aria-label="#hero-section"]') as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div style={{ color: color, borderLeft: `5px solid ${color}` }}>
        <div className="ml-2">
          <h1 className="text-2xl font-bold">
            Available properties
          </h1>
          <p className="headingDesc">
            Your next property could be here
          </p>
        </div>
      </div>
      <br />

      <div className="bg-white rounded-lg shadow-sm p-4" style={{ backgroundColor: hexToRGBA(color, 0.1), }}>
        {/* Top row: BHK tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No BHK data available</div>
          ) : (
            items.map((b, i) => (
              <button
                key={`${b.bhk}-${i}`}
                onClick={() => setActiveBhkIndex(i)}
                aria-pressed={i === activeBhkIndex}
                className="px-3 py-2 rounded-md text-sm font-medium transition-shadow inline-flex items-center gap-2 shadow"
                style={
                  i === activeBhkIndex
                    ? { backgroundColor: color, color: "#FFF" } // active state
                    : { backgroundColor: "#f3f4f6", color: "#2c2c2cff" } // default gray
                }
              >
                <span className="whitespace-nowrap">
                  {b.label ?? b.bhkLabel ?? `${b.bhk} BHK`}
                </span>
                {showFlatLabel && (
                  <span className="text-xs hidden sm:inline">
                    FLAT
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Sqft chips */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
          {sqftLabels.length === 0 ? (
            <div className="text-sm text-gray-500">No units found</div>
          ) : (
            sqftLabels.map((label, idx) => (
              <button
                key={`${label}-${idx}`}
                onClick={() => setActiveUnitIndex(idx)}
                className="whitespace-nowrap px-3 py-2 rounded-md text-sm border transition"
                style={
                  idx === activeUnitIndex
                    ? { borderColor: color, backgroundColor: '#FFF', color: color } // sky-600
                    : {
                      backgroundColor: "#ffffff",
                      color: "#374151",
                      borderColor: "#e5e7eb",
                    } // gray variants
                }
                aria-pressed={idx === activeUnitIndex}
              >
                {label}
              </button>
            ))
          )}
        </div>

        {/* Main grid: large image left, details right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: image / plan */}
          <div className="lg:col-span-8">
            <div className="bg-gray-50 rounded-md p-4 flex items-center justify-center">
              {/* image container keeps aspect and responsiveness */}
              <div className="relative w-full max-h-[520px] rounded-md overflow-hidden bg-white">
                {activeUnit?.plan?.url ?? DEV_PLAN_URL ? (
                  <>
                    <div
                      ref={planScrollRef}
                      onPointerDown={handlePlanPointerDown}
                      onPointerMove={handlePlanPointerMove}
                      onPointerUp={stopPlanDrag}
                      onPointerCancel={stopPlanDrag}
                      onPointerLeave={stopPlanDrag}
                      className={`h-[420px] overflow-auto select-none ${canDragPlan
                          ? isDraggingPlan
                            ? "cursor-grabbing"
                            : "cursor-grab"
                          : "cursor-default"
                        }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeUnit?.plan?.url ?? DEV_PLAN_URL}
                        alt={`Plan ${activeBhk?.label ?? activeBhk?.bhkLabel ?? activeBhk?.bhk ?? ""}`}
                        draggable={false}
                        className="max-w-none object-contain transition-[height,width] duration-200 ease-out"
                        style={{
                          width: `${planZoom * 100}%`,
                          height: `${planZoom * 100}%`,
                        }}
                      />
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 p-1 shadow-sm">
                      <button
                        type="button"
                        aria-label="Zoom out plan"
                        onClick={() => zoomPlan("out")}
                        disabled={!canZoomOut}
                        className="flex h-8 w-8 items-center justify-center rounded text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Reset plan zoom"
                        onClick={() => setPlanZoom(MIN_PLAN_ZOOM)}
                        className="h-8 min-w-12 rounded px-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        {Math.round(planZoom * 100)}%
                      </button>
                      <button
                        type="button"
                        aria-label="Zoom in plan"
                        onClick={() => zoomPlan("in")}
                        disabled={!canZoomIn}
                        className="flex h-8 w-8 items-center justify-center rounded text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[420px] text-gray-400">
                    No plan available
                  </div>
                )}
              </div>
            </div>

            {/* On small screens show summary under image */}
            <div className="mt-4 lg:hidden">
              <div className="flex gap-1 items-center">
                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-bold">
                    {formatINR(activeUnit?.maxPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Area</div>
                  <div className="text-sm">
                    {formatAreaUnit(activeUnit, isLand)}
                  </div>
                </div>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={scrollToHero}
                    style={{ backgroundColor: color, color: '#FFF' }}
                    className="px-4 py-2 rounded-md  font-semibold"
                  >
                    Book a Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <aside className="lg:col-span-4">
            <div className="p-4 rounded-md">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={scrollToHero}
                  style={{ backgroundColor: color }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white font-semibold hover:brightness-95 transition"
                >
                  Price on Request
                </button>
              </div>

              <ul className="mt-6 space-y-3 text-gray-700">
                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Unit</span>
                  <span className="font-medium">
                    {activeBhk?.label ??
                      activeBhk?.bhkLabel ??
                      (activeBhk?.bhk ? `${activeBhk.bhk} BHK` : "—")}
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Area</span>
                  <span className="font-medium">
                    {formatAreaUnit(activeUnit, isLand)}
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">RERA Number</span>
                  <span className="font-medium">{reraNumber}</span>
                </li>



                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Parking</span>
                  <span className="font-medium">Available</span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Possession</span>
                  <div className="font-medium mt-1">Dec. 2025</div>
                </li>
              </ul>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={scrollToHero}
                  style={{ backgroundColor: color }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white font-semibold hover:brightness-95 transition"
                >
                  Book a Consultation
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
