import { sendEmail } from "./email.service";
import {
  ownerListingApprovalEmail,
  ownerListingApprovalEmailSubject,
  ownerSubscriptionActivatedEmail,
  ownerSubscriptionActivatedEmailSubject,
  listingSubmittedTemplate,
} from "./templates/ownerTemplates/email.templates";
import {
  agentListingApprovedEmail,
  agentListingApprovedEmailSubject,
  agentSubscriptionActivatedEmail,
  agentSubscriptionActivatedEmailSubject,
  agentListingSubmittedEmail,
  agentListingSubmittedEmailSubject,
} from "./templates/agentTemplates/email.templates";

type ListingSubmittedEmailOptions = {
  roleName?: string | undefined;
  location?: string | undefined;
  link?: string | undefined;
  helplineNumber?: string | undefined;
};

type ListingApprovedEmailOptions = {
  roleName?: string | undefined;
  location?: string | undefined;
  activeUsers?: string | undefined;
  link?: string | undefined;
};

type SubscriptionActivatedEmailOptions = {
  roleName?: string | undefined;
  invoiceLink?: string | undefined;
  link?: string | undefined;
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
    link,
    helplineNumber,
  } = options;
  const isAgent = roleName === "sales_agent" || roleName === "agent";

  if (isAgent) {
    const html = agentListingSubmittedEmail(
      name,
      property,
      location,
      link,
      helplineNumber,
    );

    return sendEmail(
      email,
      agentListingSubmittedEmailSubject(name, property, location),
      html,
    );
  }

  const html = listingSubmittedTemplate(name, property);

  return sendEmail(email, "Listing Submitted Successfully", html);
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
    activeUsers = "many",
    link = "https://propenu.com/my-properties",
  } = options;
  const isAgent = roleName === "sales_agent" || roleName === "agent";

  if (isAgent) {
    const html = agentListingApprovedEmail(
      name,
      property,
      location,
      activeUsers,
    );

    return sendEmail(
      email,
      agentListingApprovedEmailSubject(name, property, location),
      html,
    );
  }

  const html = ownerListingApprovalEmail(
    name,
    property,
    location,
    activeUsers,
    link,
  );

  return sendEmail(
    email,
    ownerListingApprovalEmailSubject(name, property, location),
    html,
  );
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
    const html = agentSubscriptionActivatedEmail(
      name,
      subscriptionName,
      invoiceLink,
    );

    return sendEmail(
      email,
      agentSubscriptionActivatedEmailSubject(name, subscriptionName),
      html,
    );
  }

  const html = ownerSubscriptionActivatedEmail(
    name,
    subscriptionName,
    invoiceLink,
    link,
  );

  return sendEmail(
    email,
    ownerSubscriptionActivatedEmailSubject(name, subscriptionName),
    html,
  );
};
