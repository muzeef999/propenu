import { notificationTemplates } from "./templates";
import { renderTemplate } from "./templateEngine";
import admin from "./firebase"; // your firebase init

export const sendTemplateNotification = async ({ token, templateKey,
 data,
}: {
  token: string;
  templateKey: string;
  data: Record<string, string>;
}) => {
  const template = notificationTemplates[templateKey];

  if (!template) {
    throw new Error("Template not found");
  }

  const title = renderTemplate(template.title, data);
  const body = renderTemplate(template.body, data);

  return admin.messaging().send({
    token,
    notification: { title, body },
  });
};


export const sendBulkNotification = async ({
  tokens,
  title,
  body,
  data = {},
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: any;
}) => {
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });

  console.log("✅ Bulk push:", response.successCount);
  return response;
};




export const sendBulkPush = async ({  tokens,  title,  body,  image, data = {},
}: {
  tokens: string[];
  title: string;
  body: string;
  image?: string;
  data?: Record<string, string>;
}) => {
  try {
    if (!tokens?.length) {
      console.warn("⚠️ No tokens provided");
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,

      // 🔔 Notification
      notification: {
        title,
        body,
        ...(image ? { image } : {}),
      },

      // 📦 Data
      data,

      // 🤖 Android
      android: {
        priority: "high",
        notification: {
          sound: "default",
          ...(image ? { imageUrl: image } : {}),
        },
      },

      // 🍎 iOS (✅ CORRECT WAY)
      apns: {
        payload: {
          aps: {
            sound: "default",
            "mutable-content": 1, // 🔥 REQUIRED for images
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    };

    const response = await admin
      .messaging()
      .sendEachForMulticast(message);

    console.log("✅ Success:", response.successCount);
    console.log("❌ Failed:", response.failureCount);

    const failedTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      const token = tokens[idx];

      if (!resp.success && token) {
        failedTokens.push(token);
        console.error("❌ Token failed:", token, resp.error?.message);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error("❌ FCM Bulk Error:", error);
    throw error;
  }
};