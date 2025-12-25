// components/FilterDropdown.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

export type Align = "left" | "center" | "right";

export interface FilterDropdownProps {
  triggerLabel?: React.ReactNode;
  renderContent: (close: () => void) => React.ReactNode;
  width?: string;
  align?: Align;
  showArrow?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FilterDropdown({
  triggerLabel,
  renderContent,
  width = "w-auto",
  align = "left",
  open: controlledOpen,
  onOpenChange,
  showArrow = true,
  className,
}: FilterDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const openState =
    typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (typeof controlledOpen !== "boolean") setInternalOpen(v);
  };

  useEffect(() => {
    if (!openState) return;

    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false); // 👈 CLOSES DROPDOWN
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openState]);

  /* ---------------- Alignment ---------------- */
  const alignClass =
    align === "left"
      ? "left-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-0";

  const arrowAlignClass =
    align === "left"
      ? "left-6"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-6";

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(!openState)}
        aria-haspopup="menu"
        aria-expanded={openState}
        className="cursor-pointer select-none"
      >
        {typeof triggerLabel === "string" ? (
          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <span className="text-sm font-medium">{triggerLabel}</span>
          </button>
        ) : (
          triggerLabel
        )}
      </div>

      {/* ================= OPEN STATE ================= */}
      {openState && (
        <>
          {/* Backdrop (visual only) */}
          <div className="fixed top-30 left-0 right-0 bottom-0 bg-black/45 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown Panel */}
          <div className={`absolute z-50 mt-2 ${alignClass}`}>
            <div
              className={`${width} bg-white rounded-xl border border-gray-200 shadow-lg p-3 relative`}
            >
              {showArrow && (
                <div
                  className={`absolute -top-2 ${arrowAlignClass} pointer-events-none`}
                >
                  <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-gray-200" />
                </div>
              )}

              {renderContent(() => setOpen(false))}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-primary font-medium text-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
