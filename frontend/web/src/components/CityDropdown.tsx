// components/CityDropdown.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDropdownIcon, LocationIcon } from "@/icons/icons"; // keep your icon
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";

export default function CityDropdown() {
  const { city, popular, normal, setCity } = useCity();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function onSelect(item: LocationItem) {
    setCity(item);
    setOpen(false);
    btnRef.current?.focus();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-primary transition focus:outline-none focus:ring-2 focus:ring-primary/40"
        title={city?.name ?? "Hyderabad"}
      >
        <LocationIcon size={18} color={"#374151"} />
        <span className="min-w-[90px] text-left">
          {city?.name ?? "Hyderabad"}
        </span>
        <ArrowDropdownIcon
          size={14}
          color={"#374151"}
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select city"
          className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Choose city</div>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Search cities..."
                className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 outline-none focus:ring-1 focus:ring-primary/40"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
              />
            </div>
          </div>

          {/* Popular cities */}
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">Popular</div>
            <div className="flex flex-wrap gap-2">
              {popular.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-primary/10 text-sm text-gray-700"
                  role="menuitem"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3">
            <div className="text-xs text-gray-500 mb-2">Other Cities</div>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2">
              {normal.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                  role="menuitem"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.state ?? c.country ?? ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer: Clear / View All (optional) */}
          <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-100">
            <button
              className="text-sm text-red-500 hover:underline"
              onClick={() => {
                setCity(null);
                setOpen(false);
              }}
            >
              Clear selection
            </button>
            <button
              className="text-sm text-gray-600 hover:text-primary"
              onClick={() => {
                // optional: navigate to city listing page or open full modal
                setOpen(false);
              }}
            >
              View all cities
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
