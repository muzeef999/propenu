import axios from "axios";
import {
  createRequestId,
  emitRequestMonitorEvent,
  getRateLimitResetMs,
} from "@/utilies/requestMonitor";

const url = process.env.NEXT_PUBLIC_API_URL

const axiosInstance = axios.create({
  baseURL: `${url}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const requestUrl = `${config.baseURL || ""}${config.url || ""}`;

  (config as any).metadata = { requestId, startedAt, requestUrl };

  if (typeof window !== "undefined") {
    emitRequestMonitorEvent({
      id: requestId,
      method: (config.method || "GET").toUpperCase(),
      url: requestUrl,
      startedAt,
    });
  }

  return config;
});

function getRateLimitDetails(error: any) {
  const apiMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Too many requests. Please slow down and try again shortly.";

  const retryAfterMs = getRateLimitResetMs(error?.response?.headers || {});

  return {
    message: apiMessage,
    startedAt: Date.now(),
    resetAt: Date.now() + retryAfterMs + 1500,
  };
}

axiosInstance.interceptors.response.use(
  (response) => {
    const metadata = (response.config as any).metadata;
    if (metadata && typeof window !== "undefined") {
      emitRequestMonitorEvent({
        id: metadata.requestId,
        method: (response.config.method || "GET").toUpperCase(),
        url: metadata.requestUrl || response.config.url || "",
        status: response.status,
        durationMs: Date.now() - metadata.startedAt,
        startedAt: metadata.startedAt,
        endedAt: Date.now(),
        ok: response.status < 400,
      });
    }

    return response;
  },
  async (error) => {
    const config = error?.config;
    const metadata = config ? (config as any).metadata : null;

    if (metadata && typeof window !== "undefined") {
      emitRequestMonitorEvent({
        id: metadata.requestId,
        method: (config.method || "GET").toUpperCase(),
        url: metadata.requestUrl || config.url || "",
        status: error?.response?.status,
        durationMs: Date.now() - metadata.startedAt,
        startedAt: metadata.startedAt,
        endedAt: Date.now(),
        ok: false,
      });
    }

    if (error?.response?.status === 429 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("propenu:rate-limit", {
          detail: getRateLimitDetails(error),
        })
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
