"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownItem = {
  id?: string | number;
  label: string;
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => void;
};

export type DropdownProps = {
  buttonClass?: string;
  buttonContent?: React.ReactNode;
  items?: DropdownItem[];
  align?: "left" | "right";
};

export default function SingleDropDown({
  buttonClass = "px-3 py-1.5 flex rounded-md hover:bg-gray-100 transition",
  buttonContent = "Menu",
  items = [],
  align = "right",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);

  // Close on click outside & keyboard nav
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (!open) return;

      const focusedIndex = itemsRef.current.findIndex(
        (el) => el === document.activeElement
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(itemsRef.current.length - 1, focusedIndex + 1);
        itemsRef.current[next]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(0, focusedIndex - 1);
        itemsRef.current[prev]?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Auto-focus first item
  useEffect(() => {
    if (open) {
      setTimeout(() => itemsRef.current[0]?.focus(), 0);
    }
  }, [open]);

  const position =
    align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right";

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        type="button"
        className={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {buttonContent}
      </button>

      <div
        ref={panelRef}
        role="menu"
        aria-hidden={!open}
        className={`${
          open ? "block" : "hidden"
        } absolute z-50 mt-2 w-48 ${position} rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none`}
      >
        <div className="py-1">
          {items.map((item, idx) => (
            <button
              key={item.id ?? idx}
              ref={(el) => {
                if (el) itemsRef.current[idx] = el;
              }}
              role="menuitem"
              tabIndex={0}
              onClick={(e) => {
                setOpen(false);
                item.onClick?.(e);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setOpen(false);
                  item.onClick?.(e);
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
