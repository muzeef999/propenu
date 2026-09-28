import {
  emailLayout,
  ctaButton,
  infoBox,
  p,
  h1,
  regards,
  formatLocation,
  formatActiveUsers,
  resolveHelplineAndUnsubscribe,
} from "../ownerTemplates/email.templates";

// ─── AGENT WELCOME ───────────────────────────────────────────────────────────

export const agentWelcomeEmailSubject = (name: string) =>
  `${name}, Welcome to Propenu — You're Verified`;

export const agentWelcomeEmail = (
  name: string,
  link: string = "https://propenu.com/postproperty",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Welcome to Propenu")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("Welcome to <strong>Propenu</strong> — your verification is now complete.")}
    ${p("You're officially part of a platform built on trust — with verified users, verified properties, zero spam, and secure transactions.")}
    ${p("You can now post your property and move ahead with confidence on Propenu.")}
    ${ctaButton("Click here to start posting your property", link)}
    ${p("We're excited to have you with us and wish you great success on the platform.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT SUBSCRIPTION REQUIRED ─────────────────────────────────────────────

export const agentSubscriptionRequiredEmailSubject = (name: string) =>
  `${name}, Activate Your Subscription to Start Posting`;

export const agentSubscriptionRequiredEmail = (
  name: string,
  link: string = "https://propenu.com/plans/pricing/agent-plan",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Subscription Required")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("To start posting properties on Propenu, please activate your subscription plan. Once subscribed, you can list properties and begin connecting with genuine buyers/tenants.")}
    ${p("Your next listing opportunity is just one step away — choose a plan and get started today.")}
    ${ctaButton("Activate Subscription Now", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT SUBSCRIPTION ACTIVATED ────────────────────────────────────────────

export const agentSubscriptionActivatedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;

export const agentSubscriptionActivatedEmail = (
  name: string,
  subscriptionName: string,
  invoiceLink: string = "https://propenu.com/agent/account-settings",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Payment Successful &amp; Subscription Activated")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your payment has been successfully processed, and your <strong>${subscriptionName}</strong> subscription is now active on Propenu.`)}
    ${p("You can now enjoy uninterrupted access to your plan features.")}
    ${p("You can download your invoice below.")}
    ${ctaButton("Download your invoice here", invoiceLink)}
    ${p("Thank you for choosing Propenu.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT PAYMENT FAILED ────────────────────────────────────────────────────

export const agentPaymentFailedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Failed — Retry Your ${subscriptionName} Subscription`;

export const agentPaymentFailedEmail = (
  name: string,
  link: string = "https://propenu.com/plans/pricing/agent-plan",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Payment Failed")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("We were unable to process your payment on Propenu.")}
    ${infoBox("No charges have been made. Please try again to complete your purchase.", "#fef2f2", "#991b1b")}
    ${ctaButton("Retry Payment to Complete Your Purchase", link)}
    ${p(`If the issue persists, you may try a different payment method or reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// ─── AGENT INCOMPLETE LISTING ────────────────────────────────────────────────

export const agentIncompleteListingEmailSubject = (name: string) =>
  `${name}, Complete Your Property Listing`;

export const agentIncompleteListingEmail = (
  name: string,
  activeUsers: string = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
  link: string = "https://propenu.com/postproperty",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Complete Your Property Listing")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("You're just a few steps away from posting your property on Propenu.")}
    ${p(`Your listing is still incomplete. Finish the remaining details to submit your property for verification and make it visible to <strong>${activeUsers}</strong> active, genuine buyers/tenants searching on the platform.`)}
    ${p("Your property could be exactly what they're looking for.")}
    ${ctaButton("Complete Your Listing to Submit for Verification", link)}
    ${p(`If you have any questions, feel free to reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// ─── AGENT LISTING SUBMITTED ─────────────────────────────────────────────────

export const agentListingSubmittedEmailSubject = (
  name: string,
  propertyName: string,
  location: string = "your area",
) => `${name}, Your ${propertyName} in ${location} Has Been Submitted Successfully`;

export const agentListingSubmittedEmail = (
  name: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/agent/my-properties",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Listing Submitted Successfully")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${location}</strong> has been successfully submitted on Propenu.`)}
    ${p("Our team is currently reviewing your listing as part of the verification process.")}
    ${infoBox(
      `Property verification is typically completed within <strong>24 hours</strong>. In rare cases, the process may take slightly longer than 24 hours. Once approved, your property will go live and become visible to genuine buyers/tenants.`,
    )}
    ${ctaButton("View Listing to Track Its Status", link)}
    ${p("Thank you for listing with Propenu.")}
    ${p(`If you have any questions, feel free to reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// ─── AGENT LISTING APPROVED ──────────────────────────────────────────────────

export const agentListingApprovedEmailSubject = (
  name: string,
  propertyName: string,
  location: any = "your area",
) => `${name}, Your ${propertyName} in ${formatLocation(location)} is Now Live on Propenu`;

export const agentListingApprovedEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  activeUsers: string = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
  link: string = "https://propenu.com/agent/my-properties",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Your Listing is Now Live")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Great news — your <strong>${propertyName}</strong> in <strong>${formatLocation(location)}</strong> on Propenu has been successfully approved and is now live on the platform.`)}
    ${p(`Your verified listing is now visible to <strong>${formatActiveUsers(activeUsers)}</strong> genuine buyers/tenants actively searching in your area. You can expect quality enquiries from interested prospects.`)}
    ${ctaButton("View Your Listing and Start Receiving Enquiries", link)}
    ${p("Thank you for choosing Propenu.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT LISTING REJECTED ──────────────────────────────────────────────────

export const agentListingRejectedEmailSubject = (
  name: string,
  propertyName: string,
  location: string = "your area",
) => `${name}, Verification Failed for Your ${propertyName} in ${location} — Please Update`;

export const agentListingRejectedEmail = (
  name: string,
  propertyName: string,
  location: string = "your area",
  reason: string = "",
  link: string = "https://propenu.com/agent/my-properties",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Verification Failed for Your Listing")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${location}</strong> on Propenu could not be approved.`)}
    ${reason ? infoBox(`<strong>Reason:</strong> ${reason}`, "#fef2f2", "#991b1b") : ""}
    ${p("Please update the required details and resubmit your listing to proceed with verification.")}
    ${ctaButton("Update Your Listing and Resubmit for Review", link)}
    ${p("Our team will review it again once updated. Verification is usually completed within <strong>24 hours</strong>, though in rare cases it may take slightly longer.")}
    ${p(`If you have any questions, feel free to reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// ─── AGENT SUBSCRIPTION EXPIRY ───────────────────────────────────────────────

export const agentSubscriptionExpiryEmailSubject = (
  name: string,
  subscriptionName: string,
  propertyName?: string,
  location?: string,
) =>
  propertyName && location
    ? `${name}, Your ${subscriptionName} subscription for ${propertyName} in ${location} is Expiring Soon`
    : `${name}, Your ${subscriptionName} subscription is Expiring Soon`;

export const agentSubscriptionExpiryEmail = (
  name: string,
  subscriptionName: string,
  link: string = "https://propenu.com/plans/pricing/agent-plan",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Your Subscription is Expiring Soon")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${subscriptionName}</strong> subscription is set to expire soon.`)}
    ${p("Renew now to continue enjoying all subscription features and enhanced exposure on Propenu.")}
    ${infoBox("Avoid any disruption to your active listings.")}
    ${ctaButton("Renew Your Subscription to Continue Your Benefits", link)}
    ${p("Stay visible. Stay ahead.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT SUBSCRIPTION ENDED ────────────────────────────────────────────────

export const agentSubscriptionEndedEmailSubject = (
  name: string,
  subscriptionName: string,
  propertyName?: string,
  location?: string,
) =>
  propertyName && location
    ? `${name}, Your ${subscriptionName} subscription for ${propertyName} in ${location} Has Ended`
    : `${name}, Your ${subscriptionName} subscription Has Ended`;

export const agentSubscriptionEndedEmail = (
  name: string,
  subscriptionName: string,
  link: string = "https://propenu.com/plans/pricing/agent-plan",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Your Subscription Has Ended")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${subscriptionName}</strong> subscription has ended.`)}
    ${p("To continue enjoying premium visibility, uninterrupted enquiries, and full access to your plan features, please renew your subscription.")}
    ${ctaButton("Renew Your Subscription to Continue Your Benefits", link)}
    ${p("Renew today to restore your full benefits.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT UPGRADE SUBSCRIPTION ──────────────────────────────────────────────

export const agentUpgradeSubscriptionEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Take Subscription/Upgrade Your ${subscriptionName} Subscription to Reach More Genuine Buyers/Tenants`;

export const agentUpgradeSubscriptionEmail = (
  name: string,
  subscriptionName: string,
  link: string = "https://propenu.com/plans/pricing/agent-plan",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Upgrade Your Subscription")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Take your property listings further by upgrading your <strong>${subscriptionName}</strong> subscription.`)}
    ${p("With premium access, you can boost visibility, generate more quality enquiries, and manage your properties more effectively — all in one place.")}
    ${infoBox("If you're serious about closing deals faster, it's time to unlock more.")}
    ${ctaButton("Take subscription/Upgrade Your Plan Now", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// ─── AGENT LISTING DEACTIVATED ───────────────────────────────────────────────

export const agentListingDeactivatedEmailSubject = (
  name: string,
  propertyName: string,
  location: any = "your area",
) => `${name}, Your ${propertyName} in ${formatLocation(location)} Has Been Deactivated`;

export const agentListingDeactivatedEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  link: string = "https://propenu.com/agent/my-properties",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Listing Deactivated")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${formatLocation(location)}</strong> on Propenu has been deactivated.`)}
    ${p("The listing is no longer visible to buyers/tenants on the platform.")}
    ${p("If you'd like to make your property visible again and continue receiving enquiries, you can easily reactivate it from your account.")}
    ${ctaButton("Reactivate Your Property Now", link)}
    ${p(`If you have any questions, feel free to reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// ─── AGENT REACTIVATE LISTING ────────────────────────────────────────────────

export const agentReactivateListingEmailSubject = (
  name: string,
  propertyName: string,
  location: any = "your area",
) => `${name}, Reactivate Your ${propertyName} in ${formatLocation(location)} to Resume Enquiries`;

export const agentReactivateListingEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  activeUsers: string = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
  link: string = "https://propenu.com/agent/my-properties",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Reactivate Your Listing to Resume Enquiries")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${formatLocation(location)}</strong> is currently not visible to <strong>${formatActiveUsers(activeUsers)}</strong> active buyers/tenants on Propenu.`)}
    ${p("If the property is still available, reactivate your listing to bring it back online and start receiving genuine enquiries again.")}
    ${ctaButton("Reactivate Listing to Resume Enquiries", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// Aliases for consistent naming
export const agentListingLiveEmail = agentListingApprovedEmail;
export const agentListingLiveEmailSubject = agentListingApprovedEmailSubject;

