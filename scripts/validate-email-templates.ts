import {
  ownerWelcomeEmail,
  ownerWelcomeEmailSubject,
  ownerListingSubmittedEmail,
  ownerListingSubmittedEmailSubject,
  ownerListingLiveEmail,
  ownerListingLiveEmailSubject,
  ownerListingRejectedEmail,
  ownerListingRejectedEmailSubject,
  ownerLowEnquiriesEmail,
  ownerLowEnquiriesEmailSubject,
  ownerDailyLeadsDigestEmail,
  ownerDailyLeadsDigestEmailSubject,
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
  ownerListingDeactivatedEmail,
  ownerListingDeactivatedEmailSubject,
} from "../backend/shared/email/templates/ownerTemplates/email.templates";

import {
  agentListingSubmittedEmail,
  agentListingSubmittedEmailSubject,
  agentListingLiveEmail,
  agentListingLiveEmailSubject,
  agentListingRejectedEmail,
  agentListingRejectedEmailSubject,
  agentListingDeactivatedEmail,
  agentListingDeactivatedEmailSubject,
} from "../backend/shared/email/templates/agentTemplates/email.templates";

import {
  buyerWelcomeEmail,
  buyerWelcomeEmailSubject,
} from "../backend/shared/email/templates/buyTemplates/email.templates";

import { REJECTION_REASONS } from "../backend/shared/constants/rejectionReasons";

// Regex to detect emojis
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

interface ValidationResult {
  name: string;
  role: "Owner" | "Agent" | "Buyer" | "General";
  subject: string;
  hasEmojiInSubject: boolean;
  hasEmojiInBody: boolean;
  hasGreenCta: boolean;
  hasHostedLogos: boolean;
  hasUnsubscribe: boolean;
  passed: boolean;
}

const sampleData = {
  name: "Manoranjan Mishra",
  propertyName: "3 BHK Luxury Apartment",
  location: "Ameerpet, Hyderabad",
  reason: REJECTION_REASONS[0],
  link: "https://propenu.com/properties/sample",
  helpline: process.env.PROPENU_HELPLINE || "+91 9182334233",
  email: "manoranjan.mishra.mail@gmail.com",
  unsubscribeUrl: "https://propenu.com/unsubscribe?token=sample",
  buyerName: "Amit Sharma",
  planName: "Prime 30-Day Boost",
};

const checks: {
  name: string;
  role: "Owner" | "Agent" | "Buyer" | "General";
  subject: string;
  html: string;
  requiresUnsubscribe?: boolean;
}[] = [
  // Owner Templates
  {
    name: "02 - Welcome to Propenu",
    role: "Owner",
    subject: ownerWelcomeEmailSubject(sampleData.name),
    html: ownerWelcomeEmail(
      sampleData.name,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "03 - Listing Submitted Successfully",
    role: "Owner",
    subject: ownerListingSubmittedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerListingSubmittedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "04 - Listing Approved & Live",
    role: "Owner",
    subject: ownerListingLiveEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerListingLiveEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "05 - Listing Verification Failed",
    role: "Owner",
    subject: ownerListingRejectedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerListingRejectedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.reason,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "06 - Low Enquiries / Boost Suggestion",
    role: "Owner",
    subject: ownerLowEnquiriesEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerLowEnquiriesEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.email,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "07 - Daily Leads Digest",
    role: "Owner",
    subject: ownerDailyLeadsDigestEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerDailyLeadsDigestEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      5,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "08 - Boost Activated",
    role: "Owner",
    subject: ownerBoostActivatedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerBoostActivatedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.planName,
      sampleData.email,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "09 - Payment Failed",
    role: "Owner",
    subject: ownerPaymentFailedEmailSubject(
      sampleData.name,
      sampleData.planName,
    ),
    html: ownerPaymentFailedEmail(
      sampleData.name,
      sampleData.link,
      sampleData.email,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "10 - Shortlisted Property",
    role: "Owner",
    subject: ownerShortlistedPropertyEmailSubject(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerShortlistedPropertyEmail(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "11 - User Contacting Owner",
    role: "Owner",
    subject: ownerUserContactingEmailSubject(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerUserContactingEmail(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "12 - Callback Request",
    role: "Owner",
    subject: ownerCallbackRequestEmailSubject(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerCallbackRequestEmail(
      sampleData.name,
      sampleData.buyerName,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "17 - Listing Deactivated",
    role: "Owner",
    subject: ownerListingDeactivatedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: ownerListingDeactivatedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },

  // Agent Templates
  {
    name: "Agent - Listing Submitted",
    role: "Agent",
    subject: agentListingSubmittedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: agentListingSubmittedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "Agent - Listing Live",
    role: "Agent",
    subject: agentListingLiveEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: agentListingLiveEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "Agent - Listing Verification Failed",
    role: "Agent",
    subject: agentListingRejectedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: agentListingRejectedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.reason,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },
  {
    name: "Agent - Listing Deactivated",
    role: "Agent",
    subject: agentListingDeactivatedEmailSubject(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
    ),
    html: agentListingDeactivatedEmail(
      sampleData.name,
      sampleData.propertyName,
      sampleData.location,
      sampleData.link,
      sampleData.helpline,
      sampleData.unsubscribeUrl,
    ),
  },

  // Buyer Templates
  {
    name: "Buyer - Welcome",
    role: "Buyer",
    subject: buyerWelcomeEmailSubject(sampleData.name),
    html: buyerWelcomeEmail(
      sampleData.name,
      sampleData.link,
      sampleData.unsubscribeUrl,
    ),
  },
];

console.log("PROPENU EMAIL TEMPLATE VALIDATOR (LOCALHOST TEST)");

let allPassed = true;
const results: ValidationResult[] = [];

for (const check of checks) {
  const hasEmojiInSubject = EMOJI_REGEX.test(check.subject);
  const hasEmojiInBody = EMOJI_REGEX.test(check.html);
  const hasGreenCta = check.html.includes("#16a34a");
  const hasHostedLogos =
    check.html.includes("propenu-logo.png") &&
    check.html.includes("apple.png") &&
    check.html.includes("playstore.png");
  const hasUnsubscribe =
    check.requiresUnsubscribe === false ||
    check.html.includes(sampleData.unsubscribeUrl) ||
    check.html.includes("unsubscribe");

  const passed =
    !hasEmojiInSubject &&
    !hasEmojiInBody &&
    hasGreenCta &&
    hasHostedLogos &&
    hasUnsubscribe;

  if (!passed) allPassed = false;

  results.push({
    name: check.name,
    role: check.role,
    subject: check.subject,
    hasEmojiInSubject,
    hasEmojiInBody,
    hasGreenCta,
    hasHostedLogos,
    hasUnsubscribe,
    passed,
  });

  const status = passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`[${status}] ${check.name} (${check.role})`);
  if (!passed) {
    if (hasEmojiInSubject)
      console.log("   ❌ Subject has emoji:", check.subject);
    if (hasEmojiInBody) console.log("   ❌ HTML body contains emoji");
    if (!hasGreenCta) console.log("   ❌ Missing green CTA (#16a34a)");
    if (!hasHostedLogos)
      console.log("   ❌ Missing hosted PNG logo / app store badges");
    if (!hasUnsubscribe) console.log("   ❌ Missing unsubscribe link");
  }
}

console.log("\n------------------------------------------------------------");
console.log(
  `Validation Completed: ${results.filter((r) => r.passed).length}/${results.length} passed.`,
);
if (allPassed) {
  console.log(
    "\x1b[32mSUCCESS: All email templates strictly meet guidelines!\x1b[0m",
  );
  console.log(" - Zero emojis in subjects & copy");
  console.log(" - Unified green theme (#16a34a)");
  console.log(" - Hosted PNG logos and store badges");
  console.log(" - Working unsubscribe URLs");
} else {
  console.log(
    "\x1b[31mWARNING: Some email templates failed verification.\x1b[0m",
  );
  process.exit(1);
}
console.log("============================================================\n");
