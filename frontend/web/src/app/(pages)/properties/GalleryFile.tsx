// components/GalleryFile.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

type GalleryFileProps = {
  gallery?: GalleryItem[];
};

const GalleryFile: React.FC<GalleryFileProps> = ({ gallery = [] }) => {
  if (!gallery.length) {
    return <p>No images available</p>;
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex];

  return (
    <div className="rounded-3xl bg-white p-3 shadow-sm h-[302px]">
      {/* MAIN IMAGE */}
      <div className="relative h-[260px] w-full overflow-hidden rounded-3xl sm:h-[360px]">
        <Image
          src={activeImage.url}
          alt={activeImage.filename}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 800px, 100vw"
          priority
        />

        {/* top-left count like “15” */}
        <div className="absolute left-4 top-4 flex items-center gap-1 text-sm font-medium text-white">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/60 bg-black/30">
            {/* simple icon placeholder */}
            ⬛
          </span>
          <span>{gallery.length}</span>
        </div>

        {/* top-right fav/share icons (dummy for now) */}
        <div className="absolute right-4 top-4 flex gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow">
            ♥
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow">
            ↗
          </button>
        </div>
      </div>

      {/* THUMBNAILS ROW */}
      <div className="mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
        {gallery.map((img, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={img.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition
              ${
                isActive
                  ? "border-emerald-500 shadow-md"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.filename}
                fill
                className="object-cover"
                sizes="112px"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GalleryFile;
