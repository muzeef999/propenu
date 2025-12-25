"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiHeart, FiImage, FiShare2, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { GalleryItem } from "@/types/agricultural";



type GalleryFileProps = {
  gallery?: GalleryItem[];
  title?: string;
};

const GalleryFile: React.FC<GalleryFileProps> = ({ gallery = [], title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openLightbox = () => {
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
    setPreviewIndex(null);
  };

  if (gallery.length < 4) {
    return <p>Not enough images</p>;
  }

  return (
    <>
      <div className="relative grid h-[270px] grid-cols-[7fr_5fr] grid-rows-2 gap-3 rounded-3xl p-3 sm:h-80">

        {/* LEFT TOP (70%) */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-2xl"
          onClick={openLightbox}
        >
          <Image
            src={gallery[0].url}
            alt={gallery[0].filename ?? title ?? "Property image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>

        {/* RIGHT TALL (30%) */}
        <div
          className="relative row-span-2 cursor-pointer overflow-hidden rounded-2xl"
          onClick={openLightbox}
        >
          <Image
            src={gallery[1].url}
              alt={gallery[1].filename ?? title ?? "Preview image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* LEFT BOTTOM (70%) */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-2xl"
          onClick={openLightbox}
        >
          <Image
            src={gallery[2].url}
              alt={gallery[2].filename ?? title ?? "Preview image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* IMAGE COUNT */}
        <div className="absolute left-6 top-6 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-sm">
          <FiImage className="h-4 w-4" />
          {gallery.length}
        </div>

        {/* ACTION ICONS */}
        <div className="absolute right-6 top-6 flex gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
            <FiHeart className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
            <FiShare2 className="h-4 w-4" />
          </button>
        </div>
      </div>


      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 p-3 bg-[#1fab60]">
            <button
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={closeLightbox}
            >
              <FiChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-7xl columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
              {gallery.map((item, index) => (
                <div
                  key={item.key}
                  className="relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-lg bg-gray-800"
                  onClick={() => setPreviewIndex(index)}
                >
                  <Image
                    src={item.url}
                      alt={gallery[3].filename ?? title ?? "Preview image"}
                    width={600}
                    height={800}
                    className="h-auto w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>

              ))}
            </div>
          </div>

          {/* Single Image Preview Overlay */}
          {previewIndex !== null && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/95">
              <button
                className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                onClick={() => setPreviewIndex(null)}
              >
                <FiX className="h-6 w-6" />
              </button>

              <button
                className="absolute left-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev !== null ? (prev + gallery.length - 1) % gallery.length : null));
                }}
              >
                <FiChevronLeft className="h-8 w-8" />
              </button>

              <div className="relative h-[85vh] w-[85vw]">
                <Image
                  src={gallery[previewIndex].url}
                    alt={gallery[previewIndex].filename ?? title ?? "Preview image"}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button
                className="absolute right-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev !== null ? (prev + 1) % gallery.length : null));
                }}
              >
                <FiChevronRight className="h-8 w-8" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GalleryFile;
