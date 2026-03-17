import admin from "./firebase";

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);

    console.log("✅ Push sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Push error:", error);
    throw error;
  }
};