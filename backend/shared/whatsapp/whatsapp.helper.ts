import {
  prepareTemplateMessage,
  sendWhatsAppEventMessage,
} from "./whatsapp.service";
import { WhatsAppEvent } from "./whatsapp.templates";

export const prepareWhatsAppEventMessage = (
  event: WhatsAppEvent,
  phone: string,
  parameters: string[],
) => {
  return prepareTemplateMessage(event, phone, parameters);
};

export const sendWhatsAppEvent = (
  event: WhatsAppEvent,
  phone: string,
  parameters: string[],
) => {
  return sendWhatsAppEventMessage(event, phone, parameters);
};

export const sendUserVerifiedOwner = (phone: string, parameters: string[]) => {
  return sendWhatsAppEvent("USER_VERIFIED_OWNER", phone, parameters);
};

export const sendUserVerifiedAgent = (phone: string, parameters: string[]) => {
  return sendWhatsAppEvent("USER_VERIFIED_AGENT", phone, parameters);
};

export const sendUserVerifiedBuyer = (phone: string, parameters: string[]) => {
  return sendWhatsAppEvent("USER_VERIFIED_BUYER", phone, parameters);
};

export const sendListingSubmittedVerification = (
  phone: string,
  ...parameters: string[]
) => {
  return sendWhatsAppEvent("LISTING_SUBMITTED", phone, parameters);
};

export const sendListingApprovedOwner = (
  phone: string,
  parameters: string[],
) => {
  return sendWhatsAppEvent("LISTING_APPROVED_OWNER", phone, parameters);
};

export const sendListingApprovedAgent = (
  phone: string,
  parameters: string[],
) => {
  return sendWhatsAppEvent("LISTING_APPROVED_AGENT", phone, parameters);
};

export const sendSubscriptionRequired = (
  phone: string,
  parameters: string[],
) => {
  return sendWhatsAppEvent("SUBSCRIPTION_REQUIRED", phone, parameters);
};

export const sendSubscriptionActivated = (
  phone: string,
  parameters: string[],
) => {
  return sendWhatsAppEvent("SUBSCRIPTION_ACTIVATED", phone, parameters);
};

export const sendPaymentSuccess = (phone: string, parameters: string[]) => {
  return sendWhatsAppEvent("PAYMENT_SUCCESS", phone, parameters);
};
