"use client";

import { useEffect } from "react";

import { trackProjectViewDuration } from "@/data/ClientData";

type Props = {
  projectId?: string | null;
};

const MIN_TRACKED_DURATION_MS = 5000;

export default function ProjectViewDurationTracker({ projectId }: Props) {
  useEffect(() => {
    if (!projectId || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let accumulatedMs = 0;
    let flushedMs = 0;

    const markHidden = () => {
      if (visibleSince != null) {
        accumulatedMs += Date.now() - visibleSince;
        visibleSince = null;
      }
    };

    const markVisible = () => {
      if (visibleSince == null && document.visibilityState === "visible") {
        visibleSince = Date.now();
      }
    };

    const flush = () => {
      markHidden();
      const pendingMs = accumulatedMs - flushedMs;
      if (pendingMs < MIN_TRACKED_DURATION_MS) {
        return;
      }

      flushedMs = accumulatedMs;
      void trackProjectViewDuration(projectId, pendingMs, window.location.pathname);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
        return;
      }

      markVisible();
    };

    const handlePageHide = () => {
      flush();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [projectId]);

  return null;
}
