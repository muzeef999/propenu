import { sendTemplateMessage } from "./whatsapp.service";
import { WHATSAPP_TEMPLATES } from "./whatsapp.templates";

export const sendOwnerAgentSignup = (phone: string, name: string, link: string) => {
  return sendTemplateMessage(
    phone,
    WHATSAPP_TEMPLATES.OWNER_AGENT_SIGNUP,
    [name, link]
  );
};

export const sendBuyerTenantSignup = (phone: string, name: string, link: string) => {
  return sendTemplateMessage(
    phone,
    WHATSAPP_TEMPLATES.BUYER_TENANT_SIGNUP,
    [name, link]
  );
};

export const sendListingSubmittedVerification = (phone: string, name: string, property: string, location: string, link: string) => {
  return sendTemplateMessage(
    phone,
    WHATSAPP_TEMPLATES.LISTING_SUBMITTED,
    [name, property, location, link]
  );
};