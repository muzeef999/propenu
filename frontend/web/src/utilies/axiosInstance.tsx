import axios from "axios";

const url = process.env.NEXT_PUBLIC_API_URL

const axiosInstance = axios.create({
  baseURL: `${url}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

function getRateLimitDetails(error: any) {
  const retryAfter = error?.response?.headers?.["retry-after"];
  const apiMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Too many requests. Please slow down and try again shortly.";

  const seconds = Number(retryAfter);
  const retryAfterMs = Number.isFinite(seconds) && seconds > 0
    ? seconds * 1000
    : 60 * 1000;

  return {
    message: apiMessage,
    startedAt: Date.now(),
    resetAt: Date.now() + retryAfterMs + 1500,
  };
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
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
