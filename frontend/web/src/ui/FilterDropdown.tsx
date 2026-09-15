// components/FilterDropdown.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Align = "left" | "center" | "right";

export interface FilterDropdownProps {
  triggerLabel?: React.ReactNode;
  renderContent: (close: () => void) => React.ReactNode;
  width?: string;
  align?: Align;
  backdropClassName?: string;
  showArrow?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showDoneButton?: boolean;
}

export default function FilterDropdown({
  triggerLabel,
  renderContent,
  width = "w-auto",
  align = "left",
  backdropClassName = "fixed inset-0 bg-black/45 z-40 transition-all duration-100",
  open: controlledOpen,
  onOpenChange,
  showArrow = true,
  className,
  showDoneButton = true,
}: FilterDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Wrap both refs so click-outside can check both
  const containerRef = useRef<HTMLDivElement | null>(null);

  const openState =
    typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (typeof controlledOpen !== "boolean") setInternalOpen(v);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---- Position the portaled panel below the trigger ---- */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: "fixed",
      top: rect.bottom + 8,
      zIndex: 9999,
    };
    if (align === "right") {
      style.right = window.innerWidth - rect.right;
    } else if (align === "center") {
      style.left = rect.left + rect.width / 2;
      style.transform = "translateX(-50%)";
    } else {
      style.left = rect.left;
    }
    setPanelStyle(style);
  }, [align]);

  useEffect(() => {
    if (!openState) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [openState, updatePosition]);

  // Close on click outside (trigger or panel) or Escape key
  useEffect(() => {
    if (!openState) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openState]);

  const arrowAlignClass =
    align === "left"
      ? "left-6"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-6";

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ""}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
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
      {openState && mounted && (
        <>
          {/* Backdrop (visual only) */}
          {createPortal(
            <div
              className={backdropClassName}
              onClick={() => setOpen(false)}
            />,
            document.body,
          )}

          {/* Dropdown Panel – portaled to body to escape any stacking context */}
          {createPortal(
            <div
              ref={panelRef}
              style={panelStyle}
            >
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
              </div>
            </div>,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
