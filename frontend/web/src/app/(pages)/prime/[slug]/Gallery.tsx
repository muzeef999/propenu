// components/Gallery.tsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";

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
  youtubeVideos?: YoutubeVideoItem[] | null;
  color?: string | null;
};

type Props = {
  gallerySummary?: GalleryItem[] | GalleryPayload | null;
  primaryColor?: string;
};

const FALLBACK_IMG = "/mnt/data/d20ab837-b1f5-4b98-9e4c-b827c8e81ccb.png";

type YoutubeVideoItem = {
  order?: number;
  title?: string;
  url?: string;
};

function normalizeGallery(incoming?: GalleryItem[] | GalleryPayload | null, explicitColor?: string | null) {
  if (Array.isArray(incoming)) {
    return { items: incoming.slice(), youtubeVideos: [] as YoutubeVideoItem[], color: explicitColor ?? "#F59E0B" };
  }
  const obj = (incoming || {}) as GalleryPayload;
  return {
    items: Array.isArray(obj.gallerySummary) ? obj.gallerySummary.slice() : [],
    youtubeVideos: Array.isArray(obj.youtubeVideos) ? obj.youtubeVideos.slice() : [],
    color: explicitColor ?? obj.color ?? "#F59E0B",
  };
}

function toYoutubeEmbedUrl(rawUrl?: string) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function Gallery(props: Props) {
  const { gallerySummary: raw, primaryColor } = props;
  const { items: rawItems, youtubeVideos: rawYoutubeVideos, color } = useMemo(
    () => normalizeGallery(raw, primaryColor ?? null),
    [raw, primaryColor]
  );

  // stable sorted items by order
  const items = rawItems.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const youtubeVideos = rawYoutubeVideos
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((video) => ({ ...video, embedUrl: toYoutubeEmbedUrl(video.url) }))
    .filter((video) => Boolean(video.embedUrl));
  const hasSingleYoutubeVideo = youtubeVideos.length === 1;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const startX = useRef<number | null>(null);
  const videoTrackRef = useRef<HTMLDivElement | null>(null);
  const originalBodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (openIndex !== null) {
      if (originalBodyOverflowRef.current === null) {
        originalBodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.classList.add("gallery-modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("gallery-modal-open");
      if (originalBodyOverflowRef.current !== null) {
        document.body.style.overflow = originalBodyOverflowRef.current;
        originalBodyOverflowRef.current = null;
      }
    }

    return () => {
      document.body.classList.remove("gallery-modal-open");
      if (originalBodyOverflowRef.current !== null) {
        document.body.style.overflow = originalBodyOverflowRef.current;
        originalBodyOverflowRef.current = null;
      }
    };
  }, [openIndex]);

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

  function scrollVideos(direction: "left" | "right") {
    const track = videoTrackRef.current;
    if (!track) return;
    const scrollAmount = Math.max(track.clientWidth * 0.9, 320);
    track.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
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
          <p className="text-sm text-slate-500">See the space before you step in</p>
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
            <div className="absolute inset-0  bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
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
              <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {youtubeVideos.length > 0 && (
        <div className="mt-4" id="video-gallery">
          <div
            ref={videoTrackRef}
            className={
              hasSingleYoutubeVideo
                ? "mx-auto max-w-4xl"
                : "flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1"
            }
          >
            {youtubeVideos.map((video, idx) => (
              <div
                key={`${video.url}-${idx}`}
                className={
                  hasSingleYoutubeVideo
                    ? "w-full rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100"
                    : "shrink-0 w-full md:w-1/3 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 snap-start"
                }
              >
                <div className="relative w-full pb-[56.25%]">
                  <iframe
                    src={video.embedUrl as string}
                    title={video.title || `YouTube video ${idx + 1}`}
                    className="absolute top-0 left-0 w-full h-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-3 text-sm font-medium text-slate-700 capitalize line-clamp-1">
                  {video.title || `Video ${idx + 1}`}
                </div>
              </div>
            ))}
          </div>
          {!hasSingleYoutubeVideo && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => scrollVideos("left")}
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Previous videos"
              >
                <HiChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollVideos("right")}
                className="h-9 w-9 rounded-full border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Next videos"
              >
                <HiChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          onClick={() => setOpenIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute right-0 top-0 z-30 h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 transition flex items-center justify-center"
              aria-label="Close gallery"
            >
              <HiXMark size={24} />
            </button>

            {/* Main Media Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl pt-12 md:pt-0">

              {/* Arrows */}
              <button
                onClick={prev}
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md transition flex items-center justify-center"
                aria-label="Previous"
              >
                <HiChevronLeft size={22} />
              </button>

              <button
                onClick={next}
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-md transition flex items-center justify-center"
                aria-label="Next"
              >
                <HiChevronRight size={22} />
              </button>

              {/* Media */}
              {items[openIndex]?.isVideo ? (
                <video
                  src={items[openIndex]?.url}
                  controls
                  autoPlay
                  className="w-full max-h-[75vh] object-contain"
                />
              ) : (
                <img
                  src={items[openIndex]?.url ?? FALLBACK_IMG}
                  alt={items[openIndex]?.title}
                  className="w-full max-h-[75vh] object-contain"
                />
              )}

              {/* Caption Overlay */}
              <div className="absolute bottom-0 w-full bg-linear-to-t from-black/80 to-transparent p-6 text-white">
                <div className="text-lg font-semibold">
                  {items[openIndex]?.title}
                </div>
                <div className="text-sm text-white/70">
                  {items[openIndex]?.category}
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {items.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => setOpenIndex(idx)}
                  className={`shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${openIndex === idx
                    ? "ring-2 ring-white scale-90"
                    : "opacity-70 hover:opacity-100"
                    }`}
                  style={{ width: 110 }}
                >
                  <img
                    src={it?.thumbUrl ?? it?.url ?? FALLBACK_IMG}
                    alt={it?.title}
                    className="w-full h-15 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
