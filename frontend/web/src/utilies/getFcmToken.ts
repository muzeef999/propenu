import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";

export const getFcmToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BMwMpBYVAffnc2b-1onDx32UcwXBTPumJLQO3SSKjsF0QXuBL7ltHsywuVGikJcAnPKTzgG-r-Ran1K2QMg6lBk",
    });

    console.log("🔥 FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};