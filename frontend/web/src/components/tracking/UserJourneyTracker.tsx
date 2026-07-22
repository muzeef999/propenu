"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackInteraction } from "@/services/trackingService";

/** Global, non-blocking first-party journey capture for authenticated users. */
export default function UserJourneyTracker() {
  const pathname = usePathname();
  const enteredAt = useRef(Date.now());
  const firstTrackedPage = useRef(true);
  const page = pathname;

  useEffect(() => {
    enteredAt.current = Date.now();
    trackInteraction({
      eventType: "page_view",
      eventCategory: "navigation",
      source: document.referrer ? "referral" : "direct",
      metadata: {
        route: page,
        sessionEntry: firstTrackedPage.current,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
      },
    });
    firstTrackedPage.current = false;

    return () => {
      trackInteraction({
        eventType: "page_exit",
        eventCategory: "navigation",
        source: "propenu_web",
        metadata: { route: page, durationMs: Date.now() - enteredAt.current },
      });
    };
  }, [page]);

  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        trackInteraction({
          eventType: "session_heartbeat",
          eventCategory: "session",
          source: "propenu_web",
          metadata: { route: page, activeMs: Date.now() - enteredAt.current },
        });
      }
    }, 30_000);
    return () => window.clearInterval(heartbeat);
  }, [page]);

  return null;
}
