import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

export const getFcmToken = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.info("Push setup: Notification API is unavailable");
      return null;
    }

    console.info("Push setup: current permission", Notification.permission);
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.info("Push notification permission is not granted:", permission);
      return null;
    }

    const resolvedMessaging = await getFirebaseMessaging();
    if (!resolvedMessaging) {
      console.info("Firebase messaging is not supported in this browser.");
      return null;
    }

    const serviceWorkerRegistration =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        : undefined;

    console.info("Push setup: service worker ready", Boolean(serviceWorkerRegistration));
    const token = await getToken(resolvedMessaging, {
      vapidKey: "BMwMpBYVAffnc2b-1onDx32UcwXBTPumJLQO3SSKjsF0QXuBL7ltHsywuVGikJcAnPKTzgG-r-Ran1K2QMg6lBk",
      serviceWorkerRegistration,
    });

    console.info("Push setup: getToken result", Boolean(token));
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};
