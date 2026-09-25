import { Types } from "mongoose";
import { notificationTemplates } from "./templates";
import { renderTemplate } from "./templateEngine";
import admin from "./firebase";
import {
  deactivateDeviceTokens,
  getActiveDeviceTokensForUsers,
} from "./deviceTokens";

export type BulkNotificationResult = {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
};

export const sendTemplateNotification = async ({
  token,
  tokens,
  userId,
  userIds,
  templateKey,
  data = {},
}: {
  token?: string | null | undefined;
  tokens?: string[] | null | undefined;
  userId?: string | Types.ObjectId | null | undefined;
  userIds?: Array<string | Types.ObjectId> | null | undefined;
  templateKey: string;
  data: Record<string, string>;
}): Promise<BulkNotificationResult> => {
  const template = notificationTemplates[templateKey];

  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  const title = renderTemplate(template.title, data);
  const body = renderTemplate(template.body, data);

  const targetTokens = new Set<string>();
  if (token) targetTokens.add(String(token).trim());
  if (Array.isArray(tokens)) {
    tokens.forEach((t) => t && targetTokens.add(String(t).trim()));
  }

  const targetUserIds: Array<string | Types.ObjectId> = [];
  if (userId) targetUserIds.push(userId);
  if (Array.isArray(userIds)) targetUserIds.push(...userIds);

  if (targetUserIds.length) {
    const userTokens = await getActiveDeviceTokensForUsers(targetUserIds);
    userTokens.forEach((t) => t && targetTokens.add(String(t).trim()));
  }

  const finalTokens = Array.from(targetTokens).filter(Boolean);
  if (!finalTokens.length) {
    console.warn(`⚠️ No active device tokens found for template ${templateKey}`);
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  return sendBulkPush({
    tokens: finalTokens,
    title,
    body,
    data: {
      templateKey,
      ...data,
    },
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
  data?: Record<string, string>;
}): Promise<BulkNotificationResult> => {
  const cleanTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (!cleanTokens.length) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens: cleanTokens,
    notification: { title, body },
    data,
  });

  console.log("✅ Bulk push:", response.successCount);

  const failedTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    const token = cleanTokens[idx];
    if (!resp.success && token) {
      failedTokens.push(token);
    }
  });

  if (failedTokens.length) {
    void deactivateDeviceTokens(failedTokens).catch((err) =>
      console.warn("Failed to deactivate invalid device tokens:", err),
    );
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens,
  };
};

export const sendBulkPush = async ({
  tokens,
  title,
  body,
  image,
  data = {},
}: {
  tokens: string[];
  title: string;
  body: string;
  image?: string | null | undefined;
  data?: Record<string, string> | undefined;
}): Promise<BulkNotificationResult> => {
  try {
    const cleanTokens = Array.from(new Set(tokens.filter(Boolean)));
    if (!cleanTokens.length) {
      console.warn("⚠️ No tokens provided");
      return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: cleanTokens,

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

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("✅ Success:", response.successCount);
    console.log("❌ Failed:", response.failureCount);

    const failedTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      const token = cleanTokens[idx];

      if (!resp.success && token) {
        failedTokens.push(token);
        console.error("❌ Token failed:", token, resp.error?.message);
      }
    });

    if (failedTokens.length) {
      void deactivateDeviceTokens(failedTokens).catch((err) =>
        console.warn("Failed to deactivate invalid device tokens:", err),
      );
    }

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