"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";

type GalleryItem = {
  title?: string;
  category?: string;
  order?: number;
  url?: string;
};

type GalleryPayload = {
  gallerySummary?: GalleryItem[] | null;
  color?: string | null;
};

type Props = {
  gallerySummary?: GalleryItem[] | GalleryPayload | null;
  primaryColor?: string; 
};

const FALLBACK_IMG = "/mnt/data/d20ab837-b1f5-4b98-9e4c-b827c8e81ccb.png";

function normalizeGallery(
  incoming?: GalleryItem[] | GalleryPayload | null,
  explicitColor?: string | null
) {
  if (Array.isArray(incoming)) {
    return {
      items: incoming,
      color: explicitColor || "#F59E0B",
    };
  }

  const obj = (incoming || {}) as GalleryPayload;

  return {
    items: Array.isArray(obj.gallerySummary) ? obj.gallerySummary : [],
    color: explicitColor || obj.color || "#F59E0B",
  };
}

export default function Gallery(props: Props) {
  const { gallerySummary: raw, primaryColor } = props;

  const { items: rawItems, color } = useMemo(
    () => normalizeGallery(raw, primaryColor ?? null),
    [raw, primaryColor]
  );

  const items = rawItems.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return;
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, items.length]);

  // swipe code …
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || openIndex === null) return;
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) setOpenIndex((i) => Math.max(0, (i ?? 0) - 1));
      else setOpenIndex((i) => Math.min(items.length - 1, (i ?? 0) + 1));
    }
    startX.current = null;
  }

  if (!items || items.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-extrabold">Gallery</h2>
        <p className="text-sm text-gray-500">No images available.</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold">Gallery</h2>
          <p className="text-sm text-gray-600 mt-1">Photos & Media</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* big image */}
        <div
          className="md:col-span-7 relative rounded-lg overflow-hidden shadow cursor-pointer"
          onClick={() => setOpenIndex(0)}
        >
          <img
            src={items[0]?.url ?? FALLBACK_IMG}
            className="w-full h-64 md:h-[420px] object-cover"
            alt={items[0]?.title}
          />
        </div>

        {/* right mini grid */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4 md:grid-rows-2">
          {items.slice(1, 5).map((it, i) => (
            <div
              key={i}
              className="relative rounded-lg overflow-hidden shadow cursor-pointer"
              onClick={() => setOpenIndex(i + 1)}
            >
              <img
                src={it?.url ?? FALLBACK_IMG}
                className="w-full h-32 md:h-[200px] object-cover"
                alt={it?.title}
              />
            </div>
          ))}
        </div>
      </div>

      {/* modal same as your code */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 bg-white p-2 rounded shadow"
          >
            ✕
          </button>

          <img
            src={items[openIndex]?.url ?? FALLBACK_IMG}
            className="max-h-[80vh] object-contain"
          />
        </div>
      )}
    </section>
  );
}
