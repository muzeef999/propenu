"use client";

import { FeaturedProject } from "@/types";
import { useRef } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

type ProjectVideosProps = {
  project: FeaturedProject;
};

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

export default function ProjectVideos({ project }: ProjectVideosProps) {
  const videoTrackRef = useRef<HTMLDivElement | null>(null);
  const videos = (project.youtubeVideos ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((video) => ({ ...video, embedUrl: toYoutubeEmbedUrl(video.url) }))
    .filter((video) => Boolean(video.embedUrl));

  if (!videos.length) {
    return null;
  }

  const hasOneVideo = videos.length === 1;
  const hasTwoVideos = videos.length === 2;
  const hasMoreThanTwoVideos = videos.length > 2;

  function scrollVideos(direction: "left" | "right") {
    const track = videoTrackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction === "left" ? -track.clientWidth : track.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section id="project-videos" className="scroll-mt-20">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="text-lg font-medium text-slate-950 sm:text-xl">Videos</h2>

            {hasMoreThanTwoVideos && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollVideos("left")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-emerald-600"
                  aria-label="Previous videos"
                >
                  <HiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollVideos("right")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-emerald-600"
                  aria-label="Next videos"
                >
                  <HiChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={videoTrackRef}
            className={
              hasOneVideo
                ? "mx-auto max-w-4xl p-3 sm:p-5"
                : hasTwoVideos
                  ? "grid grid-cols-1 gap-4 p-3 sm:p-5 xl:grid-cols-2"
                  : "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth p-3 sm:p-5"
            }
          >
            {videos.map((video, index) => (
              <div
                key={`${video.url}-${index}`}
                className={
                  hasMoreThanTwoVideos
                    ? "w-full shrink-0 snap-start overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm md:w-[calc((100%-2rem)/3)]"
                    : "overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
                }
              >
                <div className="relative w-full pb-[56.25%]">
                  <iframe
                    src={video.embedUrl as string}
                    title={video.title || `${project.title} video ${index + 1}`}
                    className="absolute left-0 top-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="border-t border-slate-100 px-3 py-3 text-sm font-medium text-slate-700 sm:px-4">
                  {video.title || `Video ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
