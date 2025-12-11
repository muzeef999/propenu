// components/FilterDropdown.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

export type Align = "left" | "center" | "right";

export interface FilterDropdownProps {
  triggerLabel?: React.ReactNode;
  renderContent: (close: () => void) => React.ReactNode;
  width?: string; // tailwind width class or CSS value, e.g. "w-64" or "280px"
  align?: Align;
  openOnHover?: boolean; // true => open on mouse enter, false => open on click
  showArrow?: boolean;
  className?: string;
  open?: boolean; // controlled
  onOpenChange?: (open: boolean) => void;
}

export default function FilterDropdown({
  triggerLabel,
  renderContent,
  width = "w-auto",
  align = "left",
  open: controlledOpen,
  onOpenChange,
  openOnHover = true,
  showArrow = true,
  className,
}: FilterDropdownProps) {
  // internal state (used only when uncontrolled)
  const [internalOpen, setInternalOpen] = useState(false);

  // reference to root element
  const ref = useRef<HTMLDivElement | null>(null);

  // timers for hover open/close delays
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  // derived open state: if controlledOpen is provided, use it; otherwise use internal.
  const openState = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;

  // unified setter: update controlled parent via callback, and update internal state when uncontrolled
  const setOpen = (v: boolean) => {
    if (typeof onOpenChange === "function") onOpenChange(v);
    if (typeof controlledOpen !== "boolean") setInternalOpen(v);
  };

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // close on outside click and Escape key — use openState
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    if (openState) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openState]);

  // helpers for open/close with small delays (for hover UX)
  const openWithDelay = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current !== null) return;
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      setOpen(true);
    }, 120);
  };
  const closeWithDelay = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current !== null) return;
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, 180);
  };

  // trigger handlers
  const onTriggerMouseEnter = () => {
    if (openOnHover) openWithDelay();
  };
  const onTriggerMouseLeave = () => {
    if (openOnHover) closeWithDelay();
  };

  const onPanelMouseEnter = () => {
    // keep open while mouse in panel (cancel any pending close)
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const onPanelMouseLeave = () => {
    if (openOnHover) closeWithDelay();
  };

  // toggle (note: uses current openState)
  const toggle = () => setOpen(!openState);

  // alignment classes for dropdown panel positioning
  const alignClass =
    align === "left"
      ? "left-0"
      : align === "center"
      ? "left-1/2 transform -translate-x-1/2"
      : "right-0";

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      {/* Trigger */}
      <div
        onMouseEnter={onTriggerMouseEnter}
        onMouseLeave={onTriggerMouseLeave}
        onClick={() => {
          if (!openOnHover) toggle(); // click toggles only when openOnHover is false (clicked mode)
        }}
        aria-haspopup="menu"
        aria-expanded={openState}
        className="select-none"
      >
        {typeof triggerLabel === "string" ? (
          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <span className="text-sm font-medium">{triggerLabel}</span>
          </button>
        ) : (
          <div>{triggerLabel}</div>
        )}
      </div>

      {/* Panel */}
      {openState && (
        <div
          onMouseEnter={onPanelMouseEnter}
          onMouseLeave={onPanelMouseLeave}
          className={`absolute z-50 mt-3 ${alignClass}`}
          style={{ minWidth: 0 }}
        >
          <div
            className={`${width} bg-white rounded-xl border border-gray-200 shadow-lg p-3 relative`}
          >
            {showArrow && (
              <div className="absolute -top-2 left-4 pointer-events-none">
                <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-gray-200" />
              </div>
            )}

            {/* renderContent receives a close function so inner items can close dropdown */}
            {renderContent(() => setOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
