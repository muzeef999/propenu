// components/AvailableProperties.tsx
"use client";

import { hexToRGBA } from "@/ui/hexToRGBA";
import React, { useEffect, useMemo, useState } from "react";

type Unit = {
  minSqft?: number;
  maxPrice?: number;
  availableCount?: number;
  plan?: { url?: string };
};

type BhkItem = {
  bhk: number;
  bhkLabel?: string;
  units?: Unit[];
};

type BhkPayload = {
  bhkSummary?: BhkItem[] | null;
  color?: string | null;
};

type Props = {
  bhk?: BhkPayload | null;
};

// fallback image — replace with a public asset or import if available
const DEV_PLAN_URL = "/images/placeholder-plan.jpg";

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
  // new shape: bhk is an object containing bhkSummary and color
  const items: BhkItem[] = Array.isArray(bhk?.bhkSummary)
    ? bhk!.bhkSummary!
    : [];
  const color = (bhk?.color ?? "#F59E0B") as string;

  // default to first BHK group
  const [activeBhkIndex, setActiveBhkIndex] = useState<number>(0);
  // default to first unit within selected BHK
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(0);

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
      units.map((u) =>
        u.minSqft ? `${u.minSqft} sqft` : u.plan?.url ? "Plan" : "—"
      ),
    [units]
  );

  const activeUnit = units[activeUnitIndex];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
     
            <div  style={{color:color, borderLeft:`5px solid ${color}`}}>
              <div className="ml-2">
            <h1 className="text-2xl font-bold">
              Available properties
            </h1>
            <p className="headingDesc">
             Building excellence in Hyderabad
            </p>
          </div>
          </div>
          <br/>

      <div className="bg-white rounded-lg shadow-sm p-4" style={{backgroundColor: hexToRGBA(color, 0.1),}}>
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
                  {b.bhkLabel ?? `${b.bhk} BHK`}
                </span>
                <span className="text-xs  hidden sm:inline">
                  FLAT
                </span>
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
                    ? {  borderColor: color, backgroundColor:'#FFF', color:color } // sky-600
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
              <div className="w-full max-h-[520px] rounded-md overflow-hidden bg-white">
                {activeUnit?.plan?.url ?? DEV_PLAN_URL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeUnit?.plan?.url ?? DEV_PLAN_URL}
                    alt={`Plan ${activeBhk?.bhkLabel ?? activeBhk?.bhk ?? ""}`}
                    className="w-full h-[420px] object-cover sm:object-contain"
                    style={{ maxHeight: 520 }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[420px] text-gray-400">
                    No plan available
                  </div>
                )}
              </div>
            </div>

            {/* On small screens show summary under image */}
            <div className="mt-4 lg:hidden">
              <div className="flex gap-4 items-center">
                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-bold">
                    {formatINR(activeUnit?.maxPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Area</div>
                  <div className="text-sm">
                    {activeUnit?.minSqft ? `${activeUnit.minSqft} sqft` : "—"}
                  </div>
                </div>
                <div className="ml-auto">
                  <button
                    style={{ backgroundColor: color, color:'#FFF' }}
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
                <div>
                  <div className="text-sm text-gray-500">Starting Price</div>
                  <div className="text-xl font-bold">
                    {formatINR(activeUnit?.maxPrice)}
                  </div>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-gray-700">
                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Unit</span>
                  <span className="font-medium">
                    {activeBhk?.bhkLabel ??
                      (activeBhk?.bhk ? `${activeBhk.bhk} BHK` : "—")}
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Area</span>
                  <span className="font-medium">
                    {activeUnit?.minSqft ? `${activeUnit.minSqft} sqft` : "—"}
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bathrooms</span>
                  <span className="font-medium">2 Bathrooms</span>
                </li>

                <li className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Balcony</span>
                  <span className="font-medium">1 Balcony</span>
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
