import { sendTokenToBackend } from "@/data/ClientData";
import { getFcmToken } from "@/utilies/getFcmToken";

const WEB_PUSH_DEVICE_ID_KEY = "propenu_web_push_device_id";
let pushInitPromise: Promise<unknown> | null = null;

const getWebPushDeviceId = () => {
  if (typeof window === "undefined") return undefined;

  const existing = window.localStorage.getItem(WEB_PUSH_DEVICE_ID_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(WEB_PUSH_DEVICE_ID_KEY, next);
  return next;
};

export const initWebPushToken = async () => {
  if (typeof window === "undefined") return null;
  if (pushInitPromise) return pushInitPromise;

  console.info("Push setup: starting");
  pushInitPromise = (async () => {
    const token = await getFcmToken();

    if (!token) {
      console.info("Push setup: no FCM token returned");
      return null;
    }

    console.info("Push setup: FCM token received, saving");
    return sendTokenToBackend(token, "web", getWebPushDeviceId());
  })().finally(() => {
    pushInitPromise = null;
  });

  return pushInitPromise;
};
