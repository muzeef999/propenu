// components/FilterDropdown.tsx
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
}

/**
 * A small reusable dropdown/dialog.
 * - can open on hover or click based on openOnHover
 * - supports width and alignment props
 */
export default function FilterDropdown({
  triggerLabel,
  renderContent,
  width = "w-64",
  align = "left",
  openOnHover = true,
  showArrow = true,
  className,
}: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const openWithDelay = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (open) return;
    openTimer.current = window.setTimeout(() => setOpen(true), 120);
  };
  const closeWithDelay = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  const onTriggerMouseEnter = () => {
    setHovering(true);
    if (openOnHover) openWithDelay();
  };
  const onTriggerMouseLeave = () => {
    setHovering(false);
    if (openOnHover) closeWithDelay();
  };

  const onPanelMouseEnter = () => {
    // keep open while mouse in panel
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const onPanelMouseLeave = () => {
    if (openOnHover) closeWithDelay();
  };

  const toggle = () => setOpen((s) => !s);

  // alignment classes
  const alignClass =
    align === "left" ? "left-0" : align === "center" ? "left-1/2 transform -translate-x-1/2" : "right-0";

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      {/* Trigger */}
      <div
        onMouseEnter={onTriggerMouseEnter}
        onMouseLeave={onTriggerMouseLeave}
        onClick={() => {
          if (!openOnHover) toggle();
        }}
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
      {open && (
        <div
          onMouseEnter={onPanelMouseEnter}
          onMouseLeave={onPanelMouseLeave}
          className={`absolute z-50 mt-3 ${alignClass}`}
          style={{ minWidth: 0 }}
        >
          <div className={`${width} bg-white rounded-xl border border-gray-200 shadow-lg p-3`}>
            {showArrow && (
              <div className="absolute -top-2 left-4">
                <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-gray-200" />
              </div>
            )}
            {renderContent(() => setOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
