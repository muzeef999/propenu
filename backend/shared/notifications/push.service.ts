import { notificationTemplates } from "./templates";
import { renderTemplate } from "./templateEngine";
import admin from "./firebase"; // your firebase init

export const sendTemplateNotification = async ({
  token,
  templateKey,
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



export const sendBulkPush = async ({
  tokens,
  title,
  body,
  data = {},
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  if (!tokens.length) return;

  return admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
};