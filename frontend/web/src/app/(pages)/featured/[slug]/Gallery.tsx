// components/Gallery.tsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

type GalleryItem = {
  title?: string;
  category?: string;
  order?: number;
  url?: string;
  // optional: mark as video if true
  isVideo?: boolean;
  // optional thumbnail for video (if you want different thumb)
  thumbUrl?: string;
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

function normalizeGallery(incoming?: GalleryItem[] | GalleryPayload | null, explicitColor?: string | null) {
  if (Array.isArray(incoming)) {
    return { items: incoming.slice(), color: explicitColor ?? "#F59E0B" };
  }
  const obj = (incoming || {}) as GalleryPayload;
  return { items: Array.isArray(obj.gallerySummary) ? obj.gallerySummary.slice() : [], color: explicitColor ?? obj.color ?? "#F59E0B" };
}

export default function Gallery(props: Props) {
  const { gallerySummary: raw, primaryColor } = props;
  const { items: rawItems, color } = useMemo(() => normalizeGallery(raw, primaryColor ?? null), [raw, primaryColor]);

  // stable sorted items by order
  const items = rawItems.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const startX = useRef<number | null>(null);

  // Keyboard nav
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

  function prev() {
    setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }
  function next() {
    setOpenIndex((i) => (i === null ? null : (i + 1) % items.length));
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || openIndex === null) return;
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
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

  // helpers for overlays
  const renderCategoryPill = (it: GalleryItem) => {
    if (!it?.category) return null;
    return (
      <div
        className="absolute left-3 bottom-3 text-xs font-medium px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center gap-2"
        style={{ backdropFilter: "blur(4px)" }}
      >
        {it.isVideo ? (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 3v18l15-9L5 3z" fill="white" />
          </svg>
        ) : null}
        <span>{it.category}</span>
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div style={{ color: color, borderLeft: `5px solid ${color}` }} className="pl-3">
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="text-sm text-slate-500">Building excellence in Hyderabad</p>
        </div>
      </div>

      {/* grid: large left, 4 small right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7">
          <div
            role="button"
            onClick={() => setOpenIndex(0)}
            className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer group"
            aria-label="Open gallery"
          >
            <img
              src={items[0]?.url ?? FALLBACK_IMG}
              alt={items[0]?.title ?? "Gallery image"}
              className="w-full h-64 md:h-[420px] object-cover transition-transform group-hover:scale-105"
            />
            {renderCategoryPill(items[0])}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          {items.slice(1, 5).map((it, i) => (
            <div
              key={i}
              role="button"
              onClick={() => setOpenIndex(i + 1)}
              className="relative rounded-lg overflow-hidden shadow cursor-pointer group"
              aria-label={`Open ${it?.title ?? "gallery item"}`}
            >
              <img
                src={it?.url ?? FALLBACK_IMG}
                alt={it?.title}
                className="w-full h-32 md:h-[200px] object-cover transition-transform group-hover:scale-105"
              />
              {renderCategoryPill(it)}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* close button */}
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute right-2 top-2 z-20 bg-white/90 rounded-full p-2 shadow"
              aria-label="Close gallery"
            >
              ✕
            </button>

            {/* left arrow */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow"
              aria-label="Previous"
            >
              ‹
            </button>

            {/* right arrow */}
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 rounded-full p-2 shadow"
              aria-label="Next"
            >
              ›
            </button>

            {/* main media */}
            <div className="bg-white rounded-lg overflow-hidden">
              {/* if video: show video tag; otherwise image */}
              {items[openIndex]?.isVideo ? (
                <video
                  src={items[openIndex]?.url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] object-contain bg-black"
                />
              ) : (
                <img
                  src={items[openIndex]?.url ?? FALLBACK_IMG}
                  alt={items[openIndex]?.title}
                  className="w-full max-h-[80vh] object-contain bg-black"
                />
              )}

              {/* caption bar */}
              <div className="p-3 flex items-center justify-between border-t">
                <div>
                  <div className="font-semibold text-slate-900">{items[openIndex]?.title}</div>
                  <div className="text-sm text-slate-500">{items[openIndex]?.category}</div>
                </div>

                {/* dots */}
                <div className="flex items-center gap-2">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setOpenIndex(idx)}
                      className={`w-2 h-2 rounded-full ${openIndex === idx ? "bg-slate-900" : "bg-white/60"}`}
                      aria-label={`Go to ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* thumbnail strip (optional) */}
            <div className="mt-3 flex gap-2 overflow-x-auto py-2">
              {items.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => setOpenIndex(idx)}
                  className={`flex-shrink-0 rounded-md overflow-hidden border ${openIndex === idx ? "ring-2 ring-offset-2" : "border-transparent"}`}
                  style={{ width: 120 }}
                >
                  <img src={it?.thumbUrl ?? it?.url ?? FALLBACK_IMG} alt={it?.title} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
