"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createRequestId,
  emitRequestMonitorEvent,
  getRequestGroup,
  getRateLimitResetMs,
  RATE_LIMIT_RECOVERED_EVENT,
  REQUEST_MONITOR_EVENT,
  RequestMonitorEvent,
} from "@/utilies/requestMonitor";

type RateLimitState = {
  message: string;
  resetAt: number;
  startedAt?: number;
};

type RequestItem = RequestMonitorEvent;

const STORAGE_KEY = "propenu_rate_limit_until";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const MAX_REQUESTS = 80;

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

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input !== "string" && !(input instanceof URL) && input.method) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function isApiRequest(input: RequestInfo | URL) {
  const requestUrl = getRequestUrl(input);
  return requestUrl.includes("/api/") || (!!API_URL && requestUrl.startsWith(API_URL));
}

function getRetryAfterMs(response: Response) {
  return getRateLimitResetMs(response.headers);
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms?: number) {
  if (ms === undefined) return "running";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function RateLimitBlocker() {
  const [limit, setLimit] = useState<RateLimitState | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [now, setNow] = useState(Date.now());
  const [isRecovering, setIsRecovering] = useState(false);

  const clearLimit = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setIsRecovering(true);
    window.dispatchEvent(new CustomEvent(RATE_LIMIT_RECOVERED_EVENT));

    window.setTimeout(() => {
      setLimit((currentLimit) => {
        if (currentLimit && currentLimit.resetAt > Date.now()) {
          setIsRecovering(false);
          return currentLimit;
        }

        setIsRecovering(false);
        return null;
      });
    }, 4000);
  };

  useEffect(() => {
    if ((window as any).__propenuFetchRateLimitMonitorInstalled) return;
    (window as any).__propenuFetchRateLimitMonitorInstalled = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isApiRequest(input)) return originalFetch(input, init);

      const id = createRequestId();
      const startedAt = Date.now();
      const requestUrl = getRequestUrl(input);
      const method = getRequestMethod(input, init);

      emitRequestMonitorEvent({
        id,
        method,
        url: requestUrl,
        startedAt,
      });

      try {
        const response = await originalFetch(input, init);
        const endedAt = Date.now();

        emitRequestMonitorEvent({
          id,
          method,
          url: requestUrl,
          status: response.status,
          durationMs: endedAt - startedAt,
          startedAt,
          endedAt,
          ok: response.ok,
        });

        if (response.status === 429) {
          const retryAfterMs = getRetryAfterMs(response);
          window.dispatchEvent(
            new CustomEvent("propenu:rate-limit", {
              detail: {
                message: "Too many requests. Please slow down and try again shortly.",
                startedAt: endedAt,
                resetAt: endedAt + retryAfterMs + 1500,
              },
            }),
          );
        }

        return response;
      } catch (error) {
        const endedAt = Date.now();
        emitRequestMonitorEvent({
          id,
          method,
          url: requestUrl,
          durationMs: endedAt - startedAt,
          startedAt,
          endedAt,
          ok: false,
        });
        throw error;
      }
    };
  }, []);

  useEffect(() => {
    const handleRequestEvent = (event: Event) => {
      const detail = (event as CustomEvent<RequestMonitorEvent>).detail;
      if (!detail?.id) return;

      setRequests((current) => {
        const nextRequest = {
          ...current.find((item) => item.id === detail.id),
          ...detail,
          group: detail.group || getRequestGroup(detail.path),
        };
        return [
          nextRequest,
          ...current.filter((item) => item.id !== detail.id),
        ].slice(0, MAX_REQUESTS);
      });
    };

    window.addEventListener(REQUEST_MONITOR_EVENT, handleRequestEvent);
    return () => window.removeEventListener(REQUEST_MONITOR_EVENT, handleRequestEvent);
  }, []);

  useEffect(() => {
    setLimit(readStoredLimit());

    const handleRateLimit = (event: Event) => {
      const detail = (event as CustomEvent<RateLimitState>).detail;
      if (!detail?.resetAt) return;

      const storedLimit = readStoredLimit();
      const nextLimit = {
        message:
          detail.message ||
          "Too many requests. Please wait before using Propenu again.",
        resetAt: Math.max(detail.resetAt, storedLimit?.resetAt || 0),
        startedAt: storedLimit?.startedAt || detail.startedAt || Date.now(),
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

      if (currentTime >= limit.resetAt && !isRecovering) {
        clearLimit();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRecovering, limit]);

  const remainingMs = limit ? limit.resetAt - now : 0;
  const totalMs = limit ? Math.max(1, limit.resetAt - (limit.startedAt || now)) : 1;
  const progress = Math.max(0, Math.min(100, 100 - (remainingMs / totalMs) * 100));
  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);
  const stats = useMemo(() => {
    const failed = requests.filter((request) => request.endedAt && request.ok === false).length;
    const limited = requests.filter((request) => request.status === 429).length;
    const active = requests.filter((request) => !request.endedAt).length;
    const groups = requests.reduce<Record<string, number>>((acc, request) => {
      if (request.status === 429 || request.ok === false || !request.endedAt) {
        acc[request.group] = (acc[request.group] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      active,
      failed,
      limited,
      groups: Object.entries(groups).sort((a, b) => b[1] - a[1]),
      latest: requests.slice(0, 8),
    };
  }, [requests]);

  if (!limit && !isRecovering) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[rgba(251,255,253,0.96)] px-4 py-6 backdrop-blur-md">
      <div className="mx-auto flex min-h-full w-full max-w-[980px] items-center">
        <div className="w-full overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-[0_26px_90px_rgba(15,82,45,0.18)]">
          <div className="h-1.5 bg-emerald-50">
          <div
            className="h-full bg-[#20b35c] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

          <div className="grid gap-6 px-5 py-6 md:grid-cols-[1fr_320px] md:px-8 md:py-8">
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Request limit reached
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">
                    Too many API requests
                  </h1>
                  <p className="mt-2 max-w-[620px] text-sm leading-6 text-gray-600">
                    {isRecovering
                      ? "Your wait time is complete. Propenu is refreshing the page data now."
                      : limit?.message}
                  </p>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Status
                  </p>
                  <p className="mt-1 text-3xl font-bold text-red-700">429</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-sky-50 px-4 py-4">
                  <p className="text-sm font-semibold text-sky-700">Live</p>
                  <p className="mt-2 text-3xl font-bold text-sky-900">{stats.active}</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-700">Failed</p>
                  <p className="mt-2 text-3xl font-bold text-amber-900">{stats.failed}</p>
                </div>
                <div className="rounded-lg bg-red-50 px-4 py-4">
                  <p className="text-sm font-semibold text-red-700">Rate Limited</p>
                  <p className="mt-2 text-3xl font-bold text-red-900">{stats.limited}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {stats.groups.length ? (
                  stats.groups.map(([group, count]) => (
                    <span
                      key={group}
                      className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"
                    >
                      {group}: {count}
                    </span>
                  ))
                ) : (
                  <span className="rounded-md border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-600">
                    Waiting for request details
                  </span>
                )}
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-gray-100">
                <div className="grid grid-cols-[90px_1fr_80px_90px] bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span>Type</span>
                  <span>Endpoint</span>
                  <span>Status</span>
                  <span>Timing</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {stats.latest.map((request) => (
                    <div
                      key={request.id}
                      className="grid grid-cols-[90px_1fr_80px_90px] border-t border-gray-100 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-semibold text-gray-800">{request.group}</span>
                      <span className="truncate text-gray-500">{request.method} {request.path}</span>
                      <span className={request.status === 429 ? "font-bold text-red-700" : "font-semibold text-gray-700"}>
                        {request.status || "Live"}
                      </span>
                      <span className="text-gray-500">{formatDuration(request.durationMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-lg border border-emerald-100 bg-emerald-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {isRecovering ? "Refreshing" : "Retry timing"}
              </p>
              <p className="mt-3 text-5xl font-bold tabular-nums text-emerald-800">
                {isRecovering ? "..." : countdown}
              </p>
              <p className="mt-3 text-sm leading-6 text-emerald-900">
                {isRecovering
                  ? "Please wait. This happens automatically."
                  : "The page will resume automatically when the gateway window resets."}
              </p>

              {limit && (
                <div className="mt-5 space-y-3 text-sm text-emerald-950">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Blocked at</span>
                    <span className="tabular-nums">{formatTime(limit.startedAt || now)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">Retry after</span>
                    <span className="tabular-nums">{formatTime(limit.resetAt)}</span>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
