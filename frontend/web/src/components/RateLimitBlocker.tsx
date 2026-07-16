"use client";

import { useEffect, useMemo, useState } from "react";

type RateLimitState = {
  message: string;
  resetAt: number;
  startedAt?: number;
};

const STORAGE_KEY = "propenu_rate_limit_until";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readStoredLimit(): RateLimitState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as RateLimitState;
    if (!parsed?.resetAt || parsed.resetAt <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export default function RateLimitBlocker() {
  const [limit, setLimit] = useState<RateLimitState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isRecovering, setIsRecovering] = useState(false);

  const recoverPageData = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setIsRecovering(true);

    window.setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  useEffect(() => {
    setLimit(readStoredLimit());

    const handleRateLimit = (event: Event) => {
      const detail = (event as CustomEvent<RateLimitState>).detail;
      if (!detail?.resetAt) return;

      const nextLimit = {
        message:
          detail.message ||
          "Too many requests. Please wait before using Propenu again.",
        resetAt: detail.resetAt,
        startedAt: detail.startedAt || Date.now(),
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLimit));
      setLimit(nextLimit);
      setIsRecovering(false);
      setNow(Date.now());
    };

    window.addEventListener("propenu:rate-limit", handleRateLimit);

    return () => {
      window.removeEventListener("propenu:rate-limit", handleRateLimit);
    };
  }, []);

  useEffect(() => {
    if (!limit) return;

    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (currentTime >= limit.resetAt) {
        recoverPageData();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [limit]);

  const remainingMs = limit ? limit.resetAt - now : 0;
  const totalMs = limit ? Math.max(1, limit.resetAt - (limit.startedAt || now)) : 1;
  const progress = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);

  if (!limit && !isRecovering) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(251,255,253,0.92)] px-4 backdrop-blur-md">
      <div className="w-full max-w-[460px] overflow-hidden rounded-lg border border-emerald-100 bg-white text-center shadow-[0_26px_90px_rgba(15,82,45,0.18)]">
        <div className="h-1.5 bg-emerald-50">
          <div
            className="h-full bg-[#20b35c] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-6 py-7">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-lg font-bold text-[#20b35c]">
            429
          </div>

          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            {isRecovering ? "Loading Data Again" : "Please Wait a Moment"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {isRecovering
              ? "Your wait time is complete. Propenu is refreshing the page data now."
              : limit?.message}
          </p>

          <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {isRecovering ? "Refreshing" : "Automatically resumes in"}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-700">
              {isRecovering ? "..." : countdown}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            {isRecovering
              ? "Please wait. This happens automatically."
              : "The page will reload its data automatically. No refresh is needed."}
          </p>
        </div>
      </div>
    </div>
  );
}
