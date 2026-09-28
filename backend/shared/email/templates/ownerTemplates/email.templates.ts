// ─── SHARED LAYOUT HELPERS ───────────────────────────────────────────────────

const APP_STORE_LINK =
  process.env.APP_STORE_LINK ||
  "https://apps.apple.com/in/app/propenu/id6762111856";
const PLAY_STORE_LINK =
  process.env.PLAY_STORE_LINK ||
  "https://play.google.com/store/apps/details?id=com.propenu.app";

/** Email-safe full <table>-based layout wrapper.
 *  Renders logo header, content area, and footer with unsubscribe link.
 */
export function emailLayout(content: string, unsubscribeUrl: string): string {
  return `
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    background-color:#f4f7f5;
    margin:0;
    padding:40px 16px;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <tr>
    <td align="center">

      <!-- Main Container -->
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          max-width:560px;
          width:100%;
          background-color:#ffffff;
          border-radius:18px;
          overflow:hidden;
        "
      >

        <!-- Header -->
        <tr>
          <td style="padding:30px;background-color:#ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Logo -->
                <td align="left" valign="middle" style="vertical-align:middle;">
                  <img
                    src="https://propenu.com/email/propenu-logo.png"
                    width="151"
                    alt="Propenu"
                    style="
                      display:block;
                      width:151px;
                      max-width:151px;
                      height:auto;
                      border:0;
                      outline:none;
                      text-decoration:none;
                    "
                  />
                </td>
                <!-- App Download -->
                <td align="right" valign="middle" style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0" align="right">
                    <tr>
                      <td valign="middle" style="vertical-align:middle;padding-right:10px;font-size:11px;line-height:16px;color:#9ca3af;white-space:nowrap;">
                        Get the app from
                      </td>
                      <td width="22" height="26" valign="middle" align="center" style="width:22px;height:26px;vertical-align:middle;text-align:center;">
                        <a href="${APP_STORE_LINK}" target="_blank" style="display:block;text-decoration:none;">
                          <img src="https://propenu.com/email/apple.png" width="22" height="26" alt="App Store" style="display:block;width:22px;max-width:22px;height:26px;border:0;outline:none;text-decoration:none;" />
                        </a>
                      </td>
                      <td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
                      <td width="24" height="26" valign="middle" align="center" style="width:24px;height:26px;vertical-align:middle;text-align:center;">
                        <a href="${PLAY_STORE_LINK}" target="_blank" style="display:block;text-decoration:none;">
                          <img src="https://propenu.com/email/playstore.png" width="24" height="26" alt="Google Play" style="display:block;width:24px;max-width:24px;height:26px;border:0;outline:none;text-decoration:none;" />
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="height:1px;background-color:#eee;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:42px 42px 20px 42px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:28px 30px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;line-height:20px;color:#9ca3af;">
              This email was sent regarding your Propenu account.
            </p>
            <p style="margin:8px 0 0 0;font-size:12px;line-height:20px;">
              <a href="${unsubscribeUrl}" target="_blank" style="color:#9ca3af;text-decoration:underline;">
                Unsubscribe
              </a>
            </p>
            <p style="margin:6px 0 0 0;font-size:12px;line-height:20px;color:#9ca3af;">
              &copy; Propenu. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
`;
}

/** Renders a green CTA button. */
export function ctaButton(label: string, href: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 30px 0;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" bgcolor="#16a34a" style="border-radius:10px;">
            <a
              href="${href}"
              target="_blank"
              style="
                display:inline-block;
                padding:15px 34px;
                font-size:16px;
                line-height:20px;
                font-weight:700;
                color:#ffffff;
                text-decoration:none;
                background-color:#16a34a;
                border-radius:10px;
              "
            >
              ${label}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/** Renders a highlighted info box. */
export function infoBox(html: string, color = "#f0fdf4", textColor = "#166534"): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${color};border-radius:12px;margin:0 0 30px 0;">
  <tr>
    <td style="padding:18px 20px;">
      <p style="margin:0;font-size:15px;line-height:24px;color:${textColor};">
        ${html}
      </p>
    </td>
  </tr>
</table>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#374151;">${text}</p>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 22px 0;font-size:28px;line-height:36px;font-weight:700;color:#111827;">${text}</h1>`;
}

export function regards(): string {
  return `<p style="margin:0;font-size:16px;line-height:26px;color:#374151;">Regards,<br /><strong>Team Propenu</strong></p>`;
}

export function formatLocation(loc: any): string {
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

export function formatActiveUsers(val?: string): string {
  const clean = String(val || "10,000").replace(/\++$/, "").trim();
  return (clean || "10,000") + "+";
}

export function resolveHelplineAndUnsubscribe(
  helplineNumber?: string,
  unsubscribeUrl?: string,
): { effectiveHelpline: string; effectiveUnsubscribe: string } {
  const defaultHelpline = process.env.PROPENU_HELPLINE || "+91 9182334233";
  let effectiveHelpline = helplineNumber || defaultHelpline;
  let effectiveUnsubscribe = unsubscribeUrl || "https://propenu.com/unsubscribe";

  if (
    typeof helplineNumber === "string" &&
    (helplineNumber.startsWith("http://") ||
      helplineNumber.startsWith("https://") ||
      helplineNumber.includes("/unsubscribe") ||
      helplineNumber.includes("unsubscribe-email"))
  ) {
    effectiveUnsubscribe = helplineNumber;
    effectiveHelpline = defaultHelpline;
  }

  return { effectiveHelpline, effectiveUnsubscribe };
}

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

export const ownerWelcomeEmailSubject = (name: string) =>
  `${name}, Welcome to Propenu — You're Verified`;

export const ownerIncompleteListingEmailSubject = (name: string) =>
  `${name}, Complete Your Property Listing`;

export const ownerListingSubmittedEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Your ${propertyName} in ${location} Has Been Submitted Successfully`;

export const ownerListingApprovalEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) => `${name}, Your ${propertyName} in ${location} is Now Live on Propenu`;

export const ownerListingRejectedEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Verification Failed for Your ${propertyName} in ${location} — Please Update`;

export const ownerLowEnquiriesEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Get More Enquiries — Boost Your ${propertyName} in ${location}`;

export const ownerBoostActivatedEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Payment Successful — Boost Activated for Your ${propertyName} in ${location}`;

export const ownerPaymentFailedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Failed — Retry Your ${subscriptionName} Subscription`;

export const ownerShortlistedPropertyEmailSubject = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string,
) =>
  `${name}, ${buyerTenantName} Has Shortlisted Your ${propertyName} in ${location}`;

export const ownerUserContactingEmailSubject = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string,
) =>
  `${name}, ${buyerTenantName} Is Trying to Contact You for Your ${propertyName} in ${location}`;

export const ownerCallbackRequestEmailSubject = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string,
) =>
  `${name}, ${buyerTenantName} Requested a Callback for Your ${propertyName} in ${location}`;

export const ownerSubscriptionActivatedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;

export const ownerSubscriptionExpiryEmailSubject = (
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Your ${subscriptionName} subscription for ${propertyName} in ${location} is Expiring Soon`;

export const ownerSubscriptionEndedEmailSubject = (
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string,
) =>
  `${name}, Your ${subscriptionName} subscription for ${propertyName} in ${location} Has Ended`;

export const ownerSubscriptionPromoEmailSubject = (
  name: string,
  subscriptionName: string,
) =>
  `${name}, Take Subscription/Upgrade Your ${subscriptionName} Subscription to Reach More Genuine Buyers/Tenants`;

export const ownerListingDeactivatedEmailSubject = (
  name: string,
  propertyName: string,
  location: any,
) => `${name}, Your ${propertyName} in ${formatLocation(location)} Has Been Deactivated`;

export const ownerReactivateListingEmailSubject = (
  name: string,
  propertyName: string,
  location: any,
) =>
  `${name}, Reactivate Your ${propertyName} in ${formatLocation(location)} to Resume Enquiries`;

export const ownerLeadsDigestEmailSubject = (
  name: string,
  propertyName: string,
  location: any,
) => `${name}, New Enquiries for Your ${propertyName} in ${formatLocation(location)}`;

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

// --- Welcome ---
export const ownerWelcomeEmail = (
  name: string,
  linkOrEmail: string = "https://propenu.com/postproperty",
  maybeLink?: string,
  maybeUnsubscribeUrl?: string,
) => {
  let link = "https://propenu.com/postproperty";
  let unsubscribeUrl = "https://propenu.com/unsubscribe";

  if (maybeUnsubscribeUrl) {
    // 4 args: (name, email, link, unsubscribeUrl)
    link = maybeLink || link;
    unsubscribeUrl = maybeUnsubscribeUrl;
  } else if (maybeLink) {
    if (linkOrEmail.includes("@")) {
      // 3 args: (name, email, link)
      link = maybeLink;
    } else {
      // 3 args: (name, link, unsubscribeUrl)
      link = linkOrEmail;
      unsubscribeUrl = maybeLink;
    }
  } else if (linkOrEmail) {
    if (!linkOrEmail.includes("@")) {
      link = linkOrEmail;
    }
  }

  return emailLayout(
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
};

// --- Incomplete Listing Reminder (cron) ---
export const ownerIncompleteListingEmail = (
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
    ${p("You're just a few steps away from posting your first property on Propenu — for free.")}
    ${p(`Your listing is still incomplete. Finish the remaining details to submit your property for verification and make it visible to <strong>${formatActiveUsers(activeUsers)}</strong> active, genuine buyers/tenants searching on the platform.`)}
    ${p("Your property could be exactly what they're looking for.")}
    ${ctaButton("Complete Your Listing to Submit for Verification", link)}
    ${p(`If you have any questions, feel free to reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// --- Listing Submitted Successfully ---
export const listingSubmittedTemplate = (
  name: string,
  title: string,
  location: string = "your area",
  link: string = "https://propenu.com/my-properties",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Listing Submitted Successfully")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${title}</strong> in <strong>${location}</strong> has been successfully submitted on Propenu.`)}
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

// --- Listing Approved ---
export const ownerListingApprovalEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  activeUsers: string = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
  link: string = "https://propenu.com/my-properties",
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

// --- Listing Rejected ---
export const ownerListingRejectedEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  reason: string = "",
  link: string = "https://propenu.com/my-properties",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Verification Failed for Your Listing")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${formatLocation(location)}</strong> on Propenu could not be approved.`)}
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

// --- Low Enquiries / Boost ---
export const ownerLowEnquiriesEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  email: string = "",
  link: string = "https://propenu.com/plans",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Get More Enquiries — Boost Your Listing")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${propertyName}</strong> in <strong>${formatLocation(location)}</strong> on Propenu is live, but it hasn't received many enquiries yet.`)}
    ${p("Boosting your listing can improve visibility and help you reach more genuine buyers/tenants actively searching in your area.")}
    ${p("Give your property the extra push it deserves.")}
    ${ctaButton("Boost Your Listing to Reach More Buyers/Tenants", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Payment Successful & Boost Activated ---
export const ownerBoostActivatedEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  subscriptionName: string = "Boost",
  emailOrLink: string = "",
  maybeInvoiceLink?: string,
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const safeLocation = formatLocation(location);
  let invoiceLink = `${process.env.FRONTEND_URL || "https://propenu.com"}/settings`;
  if (maybeInvoiceLink) {
    invoiceLink = maybeInvoiceLink;
  } else if (emailOrLink && (emailOrLink.startsWith("http://") || emailOrLink.startsWith("https://"))) {
    invoiceLink = emailOrLink;
  }
  return emailLayout(
    `
    ${h1("Payment Successful &amp; Boost Activated")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your payment has been successfully processed, and your <strong>${subscriptionName}</strong> subscription on Propenu is now activated.`)}
    ${p(`The boost for your <strong>${propertyName}</strong> in <strong>${safeLocation}</strong> is now live, giving your property enhanced visibility and helping you reach more genuine buyers/tenants.`)}
    ${p("You can download your invoice below.")}
    ${ctaButton("Download Invoice", invoiceLink)}
    ${p("Thank you for choosing Propenu.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );
};

// --- Payment Failed ---
export const ownerPaymentFailedEmail = (
  name: string,
  link: string = "https://propenu.com/plans",
  email: string = "",
  helplineNumber: string = process.env.PROPENU_HELPLINE || "+91 9182334233",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) => {
  const safeLink = link && link !== "plans/retry" && !link.endsWith("/plans/retry")
    ? link
    : `${process.env.FRONTEND_URL || "https://propenu.com"}/plans`;
  const { effectiveHelpline, effectiveUnsubscribe } = resolveHelplineAndUnsubscribe(helplineNumber, unsubscribeUrl);
  return emailLayout(
    `
    ${h1("Payment Failed")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("We were unable to process your payment on Propenu.")}
    ${infoBox("No charges have been made. Please try again to complete your purchase.", "#fef2f2", "#991b1b")}
    ${ctaButton("Retry Payment to Complete Your Purchase", safeLink)}
    ${p(`If the issue persists, you may try a different payment method or reach out to our support team at <strong>${effectiveHelpline}</strong>.`)}
    ${regards()}
  `,
    effectiveUnsubscribe,
  );
};

// --- User Shortlisted Property ---
export const ownerShortlistedPropertyEmail = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string = "your area",
  link: string,
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Someone Shortlisted Your Property")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`<strong>${buyerTenantName}</strong> has shortlisted your <strong>${propertyName}</strong> in <strong>${location}</strong> on Propenu.`)}
    ${p(`This means <strong>${buyerTenantName}</strong> is interested in your property and may be planning the next step soon.`)}
    ${p("You can view the buyer/tenant details and connect directly to discuss further.")}
    ${ctaButton("View Buyer/Tenant Details &amp; Connect Now", link)}
    ${p("Quick responses can help you move the conversation forward faster.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- User Trying to Contact Owner ---
export const ownerUserContactingEmail = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string = "your area",
  link: string,
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Someone Is Trying to Contact You")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`<strong>${buyerTenantName}</strong> is trying to contact you regarding your <strong>${propertyName}</strong> in <strong>${location}</strong> on Propenu.`)}
    ${p(`This means <strong>${buyerTenantName}</strong> is interested in your property and would like to connect with you.`)}
    ${p("You can view the buyer/tenant details and connect directly to discuss further.")}
    ${ctaButton("View Buyer/Tenant Details &amp; Connect", link)}
    ${p("Respond quickly to keep the opportunity moving forward.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- User Requested Callback ---
export const ownerCallbackRequestEmail = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  location: string = "your area",
  link: string,
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("A Buyer/Tenant Requested a Callback")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`<strong>${buyerTenantName}</strong> has requested a callback regarding your <strong>${propertyName}</strong> in <strong>${location}</strong> on Propenu.`)}
    ${p(`<strong>${buyerTenantName}</strong> is interested in your property and has requested a callback to discuss further.`)}
    ${p("You can view the buyer/tenant details and connect directly to discuss further.")}
    ${ctaButton("View Buyer/Tenant Details &amp; Call Back", link)}
    ${p("Quick responses help keep buyer interest strong and move conversations forward.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Payment Successful & Subscription Activated ---
export const ownerSubscriptionActivatedEmail = (
  name: string,
  subscriptionName: string,
  email: string = "",
  invoiceLink: string,
  link: string = "https://propenu.com/plans/owner-sell",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Payment Successful &amp; Subscription Activated")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your payment has been successfully processed, and your <strong>${subscriptionName}</strong> subscription is now active on Propenu.`)}
    ${p("You can now enjoy uninterrupted access to your plan features.")}
    ${p("You can download your invoice below.")}
    ${ctaButton("Download Your Invoice", invoiceLink)}
    ${p("Thank you for choosing Propenu.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Subscription Expiry Reminder (cron) ---
export const ownerSubscriptionExpiryEmail = (
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Your Subscription is Expiring Soon")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${subscriptionName}</strong> subscription for <strong>${propertyName}</strong> in <strong>${location}</strong> is set to expire soon.`)}
    ${p("Renew now to continue enjoying all subscription features and enhanced exposure on Propenu.")}
    ${infoBox("Avoid any disruption to your active listings.")}
    ${ctaButton("Renew Your Subscription to Continue Your Benefits", link)}
    ${p("Stay visible. Stay ahead.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Subscription Ended / Renewal (cron) ---
export const ownerSubscriptionEndedEmail = (
  name: string,
  subscriptionName: string,
  propertyName: string,
  location: string = "your area",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Your Subscription Has Ended")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Your <strong>${subscriptionName}</strong> subscription for <strong>${propertyName}</strong> in <strong>${location}</strong> has ended.`)}
    ${p("To continue enjoying premium visibility, uninterrupted enquiries, and full access to your plan features, please renew your subscription.")}
    ${ctaButton("Renew Your Subscription to Continue Your Benefits", link)}
    ${p("Renew today to restore your full benefits.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Take / Upgrade Subscription Promotion (cron) ---
export const ownerSubscriptionPromoEmail = (
  name: string,
  propertyName: string,
  location: string = "your area",
  subscriptionName: string = "Premium",
  link: string = "https://propenu.com/plans/pricing/owner-rent",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Boost Your Reach with a Propenu Subscription")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Take your <strong>${propertyName}</strong> in <strong>${location}</strong> further with a Propenu subscription / <strong>${subscriptionName}</strong> subscription upgrade.`)}
    ${p("With premium access, you can boost visibility, generate more quality enquiries, and manage your properties more effectively — all in one place.")}
    ${infoBox("If you're serious about closing deals faster, it's time to unlock more.")}
    ${ctaButton("Take Subscription / Upgrade Your Plan Now", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// --- Listing Deactivated ---
export const ownerListingDeactivatedEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  link: string = "https://propenu.com/my-properties",
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

// --- Reactivate Listing (cron) ---
export const ownerReactivateListingEmail = (
  name: string,
  propertyName: string,
  location: any = "your area",
  activeUsers: string = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+",
  link: string = "https://propenu.com/my-properties",
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

// --- Leads Digest (cron — every 2 days) ---
export const ownerLeadsDigestEmail = (
  name: string,
  propertyName: string,
  location: string = "your area",
  leadCount: number,
  link: string = "https://propenu.com/my-properties",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1(`You Have ${leadCount} New Enquir${leadCount === 1 ? "y" : "ies"}`)}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p(`Good news — you have <strong>${leadCount}</strong> new response${leadCount === 1 ? "" : "s"} for your <strong>${propertyName}</strong> in <strong>${location}</strong> on Propenu.`)}
    ${p("Interested buyers/tenants are waiting to connect. Quick responses improve your chances of closing faster.")}
    ${ctaButton("View Responses and Connect with Interested Buyers/Tenants", link)}
    ${p("Stay responsive to maximise opportunities.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );

// Convenient aliases for consistent naming across scripts and callers
export const ownerListingSubmittedEmail = listingSubmittedTemplate;
export const ownerListingLiveEmail = ownerListingApprovalEmail;
export const ownerListingLiveEmailSubject = ownerListingApprovalEmailSubject;
export const ownerDailyLeadsDigestEmail = ownerLeadsDigestEmail;
export const ownerDailyLeadsDigestEmailSubject = ownerLeadsDigestEmailSubject;

