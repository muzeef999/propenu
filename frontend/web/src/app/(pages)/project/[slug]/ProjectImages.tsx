"use client";

import { FeaturedProject } from "@/types";
import { useEffect, useRef, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiPhoto, HiXMark } from "react-icons/hi2";

type ProjectImagesProps = {
  project: FeaturedProject;
};

type GalleryImage = {
  url: string;
  title?: string;
  category?: string;
  order?: number;
};

function getGalleryImages(project: FeaturedProject): GalleryImage[] {
  const images = [
    ...(project.heroImage ? [{ url: project.heroImage, title: project.title, order: -1 }] : []),
    ...(project.gallerySummary ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  ].filter((item): item is GalleryImage => Boolean(item?.url));

  const seen = new Set<string>();
  return images.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

export default function ProjectImages({ project }: ProjectImagesProps) {
  const images = getGalleryImages(project);
  const previewImages = images.slice(0, 5);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const startX = useRef<number | null>(null);
  const originalBodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (openIndex !== null) {
      if (originalBodyOverflowRef.current === null) {
        originalBodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
    } else if (originalBodyOverflowRef.current !== null) {
      document.body.style.overflow = originalBodyOverflowRef.current;
      originalBodyOverflowRef.current = null;
    }

    return () => {
      if (originalBodyOverflowRef.current !== null) {
        document.body.style.overflow = originalBodyOverflowRef.current;
        originalBodyOverflowRef.current = null;
      }
    };
  }, [openIndex]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (openIndex === null) return;

      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!images.length) {
    return null;
  }

  const activeImage = openIndex !== null ? images[openIndex] : null;

  function prev() {
    setOpenIndex((index) => (index === null ? null : (index - 1 + images.length) % images.length));
  }

  function next() {
    setOpenIndex((index) => (index === null ? null : (index + 1) % images.length));
  }

  function onTouchStart(event: React.TouchEvent) {
    startX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (startX.current === null || openIndex === null) return;

    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
    }
    startX.current = null;
  }

  return (
    <section id="project-images" className="scroll-mt-20">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            Images & Videos
          </h2>

          <div className="relative grid grid-cols-2 gap-2 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setOpenIndex(0)}
              className="absolute bottom-5 right-5 z-10 flex h-8 items-center gap-1.5 rounded-lg border border-white/70 bg-white/95 px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-600 sm:bottom-8 sm:right-8 sm:h-9 sm:gap-2 sm:px-3 sm:text-xs"
              aria-label={`Open all ${images.length} project images`}
            >
              <HiPhoto className="h-4 w-4" />
              <span>{images.length} Photos</span>
            </button>

            {previewImages.map((image, index) => {
              const isMainImage = index === 0;

              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className={`group overflow-hidden rounded-xl text-left shadow-sm cursor-pointer ${
                    isMainImage ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""
                  }`}
                  aria-label={`Open ${image.title || "project image"} preview`}
                >
                  <img
                    src={image.url}
                    alt={image.title || `${project.title} image ${index + 1}`}
                    className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      isMainImage ? "h-[220px] sm:h-full lg:h-[310px]" : "h-[120px] sm:h-[150px]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {openIndex !== null && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm md:p-6"
          onClick={() => setOpenIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="absolute right-2 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 md:right-0 md:top-0 md:h-11 md:w-11 cursor-pointer"
              aria-label="Close gallery"
            >
              <HiXMark size={24} />
            </button>

            <div className="relative overflow-hidden rounded-xl bg-black pt-12 shadow-2xl md:rounded-2xl md:pt-0">
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition  cursor-pointer hover:bg-black/65 md:left-5 md:h-11 md:w-11"
                    aria-label="Previous image"
                  >
                    <HiChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition  cursor-pointer hover:bg-black/65 md:right-5 md:h-11 md:w-11"
                    aria-label="Next image "
                  >
                    <HiChevronRight size={22} />
                  </button>
                </>
              )}

              <img
                src={activeImage.url}
                alt={activeImage.title || `${project.title} image`}
                className="max-h-[70vh] w-full object-contain md:max-h-[75vh]"
              />

              {(activeImage.title || activeImage.category) && (
                <div className="absolute bottom-0 w-full bg-linear-to-t from-black/80 to-transparent p-4 text-white md:p-6">
                  {activeImage.title && <div className="text-base font-semibold md:text-lg">{activeImage.title}</div>}
                  {activeImage.category && <div className="text-sm text-white/70">{activeImage.category}</div>}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 md:mt-6 md:gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-thumb-${index}`}
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className={`w-[88px] shrink-0 overflow-hidden rounded-lg transition md:w-[110px] ${
                      openIndex === index ? "scale-90 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Open thumbnail ${index + 1}`}
                  >
                    <img
                      src={image.url}
                      alt={image.title || `${project.title} thumbnail ${index + 1}`}
                      className="h-14 w-full object-cover md:h-16"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
