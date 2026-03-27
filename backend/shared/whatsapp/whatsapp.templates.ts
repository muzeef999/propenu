export type WhatsAppCategory = "utility" | "marketing";

export type WhatsAppEvent =
  | "USER_VERIFIED_OWNER"
  | "USER_VERIFIED_AGENT"
  | "USER_VERIFIED_BUYER"
  | "LISTING_SUBMITTED"
  | "LISTING_APPROVED_OWNER"
  | "LISTING_APPROVED_AGENT"
  | "SUBSCRIPTION_REQUIRED"
  | "SUBSCRIPTION_ACTIVATED"
  | "PAYMENT_SUCCESS";

export type WhatsAppTemplateConfig = {
  template: string;
  category: WhatsAppCategory;
  variableCount: number | null;
};

// variableCount matches the approved Meta template body placeholders exactly.
export const WHATSAPP_TEMPLATE_CONFIG: Record<
  WhatsAppEvent,
  WhatsAppTemplateConfig
> = {
  USER_VERIFIED_OWNER: {
    template: "owner_welcome",
    category: "utility",
    variableCount: 1,
  },
  USER_VERIFIED_AGENT: {
    template: "agent_welcome",
    category: "utility",
    variableCount: 1,
  },
  USER_VERIFIED_BUYER: {
    template: "buyer_welcome",
    category: "utility",
    variableCount: 1,
  },
  LISTING_SUBMITTED: {
    template: "listing_submitted",
    category: "utility",
    variableCount: 2,
  },
  LISTING_APPROVED_OWNER: {
    template: "listing_approve",
    category: "utility",
    variableCount: 2,
  },
  LISTING_APPROVED_AGENT: {
    template: "agent_listing_approved",
    category: "utility",
    variableCount: 2,
  },
  SUBSCRIPTION_REQUIRED: {
    template: "agent_subscription_required",
    category: "utility",
    variableCount: 1,
  },
  SUBSCRIPTION_ACTIVATED: {
    template: "agent_subscription_activated",
    category: "utility",
    variableCount: 2,
  },
  PAYMENT_SUCCESS: {
    template: "owner_subscription_activated",
    category: "utility",
    variableCount: 2,
  },
};

export const WHATSAPP_TEMPLATES = Object.fromEntries(
  Object.entries(WHATSAPP_TEMPLATE_CONFIG).map(([event, config]) => [
    event,
    config.template,
  ]),
) as Record<WhatsAppEvent, string>;
