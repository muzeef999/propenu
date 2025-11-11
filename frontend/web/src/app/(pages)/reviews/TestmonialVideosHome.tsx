"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const videos = [
  "/video/1.mp4",
  "/video/2.mp4",
  "/video/3.mp4",
  "/video/4.mp4",
  "/video/5.mp4",
  "/video/6.mp4",
];

// Lazy-loading video component
const VideoLazy = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load video only when visible
            el.src = src;
            el.play().catch(() => {}); // Avoid autoplay blocking errors
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="rounded-lg shadow-lg object-cover w-full max-w-[95%] "
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
};

const TestmonialVideosHome = () => {
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const midColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);

  const animateLoop = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "up" | "down",
    duration: number
  ) => {
    const el = ref.current;
    if (!el) return;

    const totalHeight = el.scrollHeight / 2;

    gsap.set(el, { y: 0 });

    const tl = gsap.timeline({ repeat: -1 });
    tl.to(el, {
      y: direction === "up" ? `-${totalHeight}px` : `${totalHeight}px`,
      duration,
      ease: "linear",
    }).set(el, { y: 0 });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      animateLoop(leftColRef, "up", 20);
      animateLoop(midColRef, "up", 60);
      animateLoop(rightColRef, "up", 20);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const allVideos = [...videos, ...videos]; // Duplicate for infinite scroll illusion

  return (
    <div className="grid grid-cols-3 gap-1 overflow-hidden items-start">
      {/* Left */}
      <div className="flex flex-col gap-3 items-center" ref={leftColRef}>
        {allVideos.map((src, i) => (
          <VideoLazy key={`left-${i}`} src={src} />
        ))}
      </div>

      {/* Middle */}
      <div className="flex flex-col gap-3 items-center" ref={midColRef}>
        {allVideos.map((src, i) => (
          <VideoLazy key={`mid-${i}`} src={src} />
        ))}
      </div>

      {/* Right */}
      <div className="flex flex-col gap-3 items-center" ref={rightColRef}>
        {allVideos.map((src, i) => (
          <VideoLazy key={`right-${i}`} src={src} />
        ))}
      </div>
    </div>
  );
};

export default TestmonialVideosHome;
