import { sendEmail } from "./email.service";
import { buildUnsubscribeUrl } from "../../services/user-service/src/utils/unsubscribeToken";
import {
  listingSubmittedTemplate,
  ownerListingApprovalEmail,
  ownerListingApprovalEmailSubject,
  ownerListingRejectedEmail,
  ownerListingRejectedEmailSubject,
  ownerLowEnquiriesEmail,
  ownerLowEnquiriesEmailSubject,
  ownerBoostActivatedEmail,
  ownerBoostActivatedEmailSubject,
  ownerPaymentFailedEmail,
  ownerPaymentFailedEmailSubject,
  ownerShortlistedPropertyEmail,
  ownerShortlistedPropertyEmailSubject,
  ownerUserContactingEmail,
  ownerUserContactingEmailSubject,
  ownerCallbackRequestEmail,
  ownerCallbackRequestEmailSubject,
  ownerSubscriptionActivatedEmail,
  ownerSubscriptionActivatedEmailSubject,
  ownerSubscriptionExpiryEmail,
  ownerSubscriptionExpiryEmailSubject,
  ownerSubscriptionEndedEmail,
  ownerSubscriptionEndedEmailSubject,
  ownerSubscriptionPromoEmail,
  ownerSubscriptionPromoEmailSubject,
  ownerListingDeactivatedEmail,
  ownerListingDeactivatedEmailSubject,
  ownerReactivateListingEmail,
  ownerReactivateListingEmailSubject,
  ownerLeadsDigestEmail,
  ownerLeadsDigestEmailSubject,
  ownerListingSubmittedEmailSubject,
} from "./templates/ownerTemplates/email.templates";
import {
  agentListingApprovedEmail,
  agentListingApprovedEmailSubject,
  agentListingRejectedEmail,
  agentListingRejectedEmailSubject,
  agentSubscriptionActivatedEmail,
  agentSubscriptionActivatedEmailSubject,
  agentListingSubmittedEmail,
  agentListingSubmittedEmailSubject,
  agentListingDeactivatedEmail,
  agentListingDeactivatedEmailSubject,
} from "./templates/agentTemplates/email.templates";

export function resolveLocation(loc: any): string {
  if (!loc) return "your area";
  if (typeof loc === "string") {
    const trimmed = loc.trim();
    if (!trimmed || trimmed === "[object Object]") return "your area";
    return trimmed;
  }
  if (typeof loc === "object") {
    return loc.city || loc.locality || loc.address || "your area";
  }
  return "your area";
}

// ─── LISTING SUBMITTED ───────────────────────────────────────────────────────

type ListingSubmittedEmailOptions = {
  roleName?: string | undefined;
  location?: string | undefined;
  link?: string | undefined;
  helplineNumber?: string | undefined;
};

export const sendListingSubmittedEmail = async (
  email: string,
  name: string,
  property: string,
  options: ListingSubmittedEmailOptions = {},
) => {
  const {
    roleName,
    location = "your area",
    link = "https://propenu.com/my-properties",
    helplineNumber,
  } = options;
  const safeLocation = resolveLocation(location);
  const isAgent = roleName === "sales_agent" || roleName === "agent";
  const unsubscribeUrl = buildUnsubscribeUrl(email);

  if (isAgent) {
    const html = agentListingSubmittedEmail(
      name,
      property,
      safeLocation,
      link,
      helplineNumber,
      unsubscribeUrl,
    );
    return sendEmail(
      email,
      agentListingSubmittedEmailSubject(name, property, safeLocation),
      html,
    );
  }

  const html = listingSubmittedTemplate(name, property, safeLocation, link, helplineNumber, unsubscribeUrl);
  return sendEmail(
    email,
    ownerListingSubmittedEmailSubject(name, property, safeLocation),
    html,
  );
};

// ─── LISTING APPROVED ────────────────────────────────────────────────────────

type ListingApprovedEmailOptions = {
  roleName?: string | undefined;
  location?: string | undefined;
  activeUsers?: string | undefined;
  link?: string | undefined;
};

export const sendListingApprovedEmail = async (
  email: string,
  name: string,
  property: string,
  options: ListingApprovedEmailOptions = {},
) => {
  const {
    roleName,
    location = "your area",
    activeUsers = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
    link = "https://propenu.com/my-properties",
  } = options;
  const safeLocation = resolveLocation(location);
  const isAgent = roleName === "sales_agent" || roleName === "agent";
  const unsubscribeUrl = buildUnsubscribeUrl(email);

  if (isAgent) {
    const html = agentListingApprovedEmail(
      name,
      property,
      safeLocation,
      activeUsers,
      link,
      unsubscribeUrl,
    );
    return sendEmail(
      email,
      agentListingApprovedEmailSubject(name, property, safeLocation),
      html,
    );
  }

  const html = ownerListingApprovalEmail(
    name,
    property,
    safeLocation,
    activeUsers,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerListingApprovalEmailSubject(name, property, safeLocation),
    html,
  );
};

// ─── LISTING REJECTED ────────────────────────────────────────────────────────

export type ListingRejectedEmailOptions = {
  roleName?: string | undefined;
  location?: string | undefined;
  reason?: string | undefined;
  link?: string | undefined;
  helplineNumber?: string | undefined;
};

export const sendListingRejectedEmail = async (
  email: string,
  name: string,
  propertyName: string,
  options: ListingRejectedEmailOptions = {},
) => {
  const {
    roleName,
    location = "your area",
    reason = "",
    link,
    helplineNumber,
  } = options;
  const safeLocation = resolveLocation(location);
  const isAgent = roleName === "sales_agent" || roleName === "agent";
  const defaultLink = isAgent
    ? `${process.env.FRONTEND_URL || "https://propenu.com"}/agent/my-properties`
    : `${process.env.FRONTEND_URL || "https://propenu.com"}/my-properties`;
  const targetLink = link || defaultLink;
  const unsubscribeUrl = buildUnsubscribeUrl(email);

  if (isAgent) {
    const html = agentListingRejectedEmail(
      name,
      propertyName,
      safeLocation,
      reason,
      targetLink,
      helplineNumber,
      unsubscribeUrl,
    );
    return sendEmail(
      email,
      agentListingRejectedEmailSubject(name, propertyName, safeLocation),
      html,
    );
  }

  const html = ownerListingRejectedEmail(
    name,
    propertyName,
    safeLocation,
    reason,
    targetLink,
    helplineNumber,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerListingRejectedEmailSubject(name, propertyName, safeLocation),
    html,
  );
};

// ─── LOW ENQUIRIES / BOOST ───────────────────────────────────────────────────

export const sendLowEnquiriesEmail = async (
  email: string,
  name: string,
  propertyName: string,
  location: any = "your area",
  link: string = `${process.env.FRONTEND_URL || "https://propenu.com"}/plans`,
) => {
  const safeLocation = resolveLocation(location);
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerLowEnquiriesEmail(name, propertyName, safeLocation, email, link, unsubscribeUrl);
  return sendEmail(
    email,
    ownerLowEnquiriesEmailSubject(name, propertyName, safeLocation),
    html,
  );
};

// ─── BOOST ACTIVATED ─────────────────────────────────────────────────────────

export const sendBoostActivatedEmail = async (
  email: string,
  name: string,
  propertyName: string,
  location: any = "your area",
  subscriptionName: string = "Boost",
  invoiceLink?: string,
) => {
  const safeLocation = resolveLocation(location);
  const targetInvoiceLink =
    invoiceLink || `${process.env.FRONTEND_URL || "https://propenu.com"}/settings`;
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerBoostActivatedEmail(
    name,
    propertyName,
    safeLocation,
    subscriptionName,
    email,
    targetInvoiceLink,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerBoostActivatedEmailSubject(name, propertyName, safeLocation),
    html,
  );
};

// ─── PAYMENT FAILED ──────────────────────────────────────────────────────────

export const sendPaymentFailedEmail = async (
  email: string,
  name: string,
  subscriptionName: string = "Subscription",
  retryLink?: string,
  helplineNumber?: string,
) => {
  const safeLink =
    retryLink && retryLink !== "plans/retry" && !retryLink.endsWith("/plans/retry")
      ? retryLink
      : `${process.env.FRONTEND_URL || "https://propenu.com"}/plans`;
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerPaymentFailedEmail(name, safeLink, email, helplineNumber, unsubscribeUrl);
  return sendEmail(
    email,
    ownerPaymentFailedEmailSubject(name, subscriptionName),
    html,
  );
};

// ─── SHORTLISTED PROPERTY ────────────────────────────────────────────────────

export const sendShortlistedPropertyEmail = async (
  email: string,
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: any = "your area",
  link: string = `${process.env.FRONTEND_URL || "https://propenu.com"}/my-properties`,
) => {
  const safeLocation = resolveLocation(location);
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerShortlistedPropertyEmail(
    name,
    buyerTenantName,
    propertyName,
    safeLocation,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerShortlistedPropertyEmailSubject(name, buyerTenantName, propertyName, safeLocation),
    html,
  );
};

// ─── USER CONTACTING OWNER ───────────────────────────────────────────────────

export const sendUserContactingEmail = async (
  email: string,
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: any = "your area",
  link: string = `${process.env.FRONTEND_URL || "https://propenu.com"}/my-properties`,
) => {
  const safeLocation = resolveLocation(location);
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerUserContactingEmail(
    name,
    buyerTenantName,
    propertyName,
    safeLocation,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerUserContactingEmailSubject(name, buyerTenantName, propertyName, safeLocation),
    html,
  );
};

// ─── CALLBACK REQUEST ────────────────────────────────────────────────────────

export const sendCallbackRequestEmail = async (
  email: string,
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: any = "your area",
  link: string = `${process.env.FRONTEND_URL || "https://propenu.com"}/my-properties`,
) => {
  const safeLocation = resolveLocation(location);
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerCallbackRequestEmail(
    name,
    buyerTenantName,
    propertyName,
    safeLocation,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerCallbackRequestEmailSubject(name, buyerTenantName, propertyName, safeLocation),
    html,
  );
};

// ─── SUBSCRIPTION ACTIVATED ──────────────────────────────────────────────────

export type SubscriptionActivatedEmailOptions = {
  roleName?: string | undefined;
  invoiceLink?: string | undefined;
  link?: string | undefined;
};

export const sendSubscriptionActivatedEmail = async (
  email: string,
  name: string,
  subscriptionName: string,
  options: SubscriptionActivatedEmailOptions = {},
) => {
  const {
    roleName,
    invoiceLink = "https://propenu.com/account-settings",
    link,
  } = options;
  const isAgent = roleName === "sales_agent" || roleName === "agent";

  if (isAgent) {
    const html = agentSubscriptionActivatedEmail(name, subscriptionName, invoiceLink);
    return sendEmail(
      email,
      agentSubscriptionActivatedEmailSubject(name, subscriptionName),
      html,
    );
  }

  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerSubscriptionActivatedEmail(
    name,
    subscriptionName,
    email,
    invoiceLink,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerSubscriptionActivatedEmailSubject(name, subscriptionName),
    html,
  );
};

// ─── SUBSCRIPTION EXPIRY REMINDER ────────────────────────────────────────────

export const sendSubscriptionExpiryEmail = async (
  email: string,
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerSubscriptionExpiryEmail(
    name,
    subscriptionName,
    propertyName,
    location,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerSubscriptionExpiryEmailSubject(name, subscriptionName, propertyName, location),
    html,
  );
};

// ─── SUBSCRIPTION ENDED ──────────────────────────────────────────────────────

export const sendSubscriptionEndedEmail = async (
  email: string,
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerSubscriptionEndedEmail(
    name,
    subscriptionName,
    propertyName,
    location,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerSubscriptionEndedEmailSubject(name, subscriptionName, propertyName, location),
    html,
  );
};

// ─── SUBSCRIPTION PROMO ──────────────────────────────────────────────────────

export const sendSubscriptionPromoEmail = async (
  email: string,
  name: string,
  propertyName: string,
  location: string = "your area",
  subscriptionName: string = "Premium",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerSubscriptionPromoEmail(
    name,
    propertyName,
    location,
    subscriptionName,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerSubscriptionPromoEmailSubject(name, subscriptionName),
    html,
  );
};

// ─── LISTING DEACTIVATED ─────────────────────────────────────────────────────

export type ListingDeactivatedEmailOptions = {
  roleName?: string | undefined;
  location?: any;
  link?: string | undefined;
  helplineNumber?: string | undefined;
};

export const sendListingDeactivatedEmail = async (
  email: string,
  name: string,
  propertyName: string,
  locationOrOptions?: any,
  maybeOptions?: ListingDeactivatedEmailOptions,
) => {
  let locationStr = "your area";
  let options: ListingDeactivatedEmailOptions = {};

  if (typeof locationOrOptions === "object" && locationOrOptions !== null && !Array.isArray(locationOrOptions)) {
    if ("roleName" in locationOrOptions || "link" in locationOrOptions || "helplineNumber" in locationOrOptions) {
      options = locationOrOptions;
      locationStr = resolveLocation(options.location);
    } else {
      locationStr = resolveLocation(locationOrOptions);
      options = maybeOptions || {};
    }
  } else {
    locationStr = resolveLocation(locationOrOptions);
    options = maybeOptions || {};
  }

  const { roleName, link, helplineNumber } = options;
  const isAgent = roleName === "sales_agent" || roleName === "agent";
  const defaultLink = isAgent
    ? `${process.env.FRONTEND_URL || "https://propenu.com"}/agent/my-properties`
    : `${process.env.FRONTEND_URL || "https://propenu.com"}/my-properties`;
  const targetLink = link || defaultLink;
  const unsubscribeUrl = buildUnsubscribeUrl(email);

  if (isAgent) {
    const html = agentListingDeactivatedEmail(
      name,
      propertyName,
      locationStr,
      targetLink,
      helplineNumber,
      unsubscribeUrl,
    );
    return sendEmail(
      email,
      agentListingDeactivatedEmailSubject(name, propertyName, locationStr),
      html,
    );
  }

  const html = ownerListingDeactivatedEmail(
    name,
    propertyName,
    locationStr,
    targetLink,
    helplineNumber,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerListingDeactivatedEmailSubject(name, propertyName, locationStr),
    html,
  );
};

// ─── REACTIVATE LISTING ──────────────────────────────────────────────────────

export const sendReactivateListingEmail = async (
  email: string,
  name: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/my-properties",
) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerReactivateListingEmail(
    name,
    propertyName,
    location,
    process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerReactivateListingEmailSubject(name, propertyName, location),
    html,
  );
};

// ─── LEADS DIGEST ────────────────────────────────────────────────────────────

export const sendLeadsDigestEmail = async (
  email: string,
  name: string,
  propertyName: string,
  location: string = "your area",
  leadCount: number,
  link: string = "https://propenu.com/my-properties",
) => {
  const unsubscribeUrl = buildUnsubscribeUrl(email);
  const html = ownerLeadsDigestEmail(
    name,
    propertyName,
    location,
    leadCount,
    link,
    unsubscribeUrl,
  );
  return sendEmail(
    email,
    ownerLeadsDigestEmailSubject(name, propertyName, location),
    html,
  );
};
