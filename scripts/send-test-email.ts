import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/services/user-service/.env
dotenv.config({ path: path.resolve(process.cwd(), "backend/services/user-service/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/gateway/.env") });

import {
  sendListingSubmittedEmail,
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendLowEnquiriesEmail,
  sendBoostActivatedEmail,
  sendPaymentFailedEmail,
  sendShortlistedPropertyEmail,
  sendUserContactingEmail,
  sendCallbackRequestEmail,
  sendListingDeactivatedEmail,
} from "../backend/shared/email/email.helper";

import {
  ownerWelcomeEmail,
  ownerWelcomeEmailSubject,
  ownerDailyLeadsDigestEmail,
  ownerDailyLeadsDigestEmailSubject,
} from "../backend/shared/email/templates/ownerTemplates/email.templates";

import {
  buyerWelcomeEmail,
  buyerWelcomeEmailSubject,
} from "../backend/shared/email/templates/buyTemplates/email.templates";

import { sendEmail } from "../backend/shared/email/email.service";
import { REJECTION_REASONS } from "../backend/shared/constants/rejectionReasons";

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const match = args.find((a) => a.startsWith(`--${flag}=`));
  if (match) return match.split("=")[1];
  const idx = args.indexOf(`--${flag}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--")) {
    return args[idx + 1];
  }
  return undefined;
};
const hasFlag = (flag: string) => args.includes(`--${flag}`);

const AVAILABLE_TYPES = [
  { id: "welcome", desc: "Welcome to Propenu (verified account)" },
  { id: "submitted", desc: "Listing Submitted Successfully" },
  { id: "live", desc: "Listing Approved & Live" },
  { id: "rejected", desc: "Listing Verification Failed (with reason)" },
  { id: "low-enquiries", desc: "Low Enquiries / Boost Suggestion" },
  { id: "digest", desc: "Daily Leads Digest" },
  { id: "boost", desc: "Boost Activated" },
  { id: "failed", desc: "Payment Failed" },
  { id: "shortlist", desc: "Shortlisted Property" },
  { id: "contact", desc: "User Contacting Owner" },
  { id: "callback", desc: "Callback Request" },
  { id: "deactivated", desc: "Listing Deactivated" },
  { id: "all", desc: "Send one of EVERY email type" },
];

if (hasFlag("list") || args.length === 0) {
  console.log("\n============================================================");
  console.log("   PROPENU CLI EMAIL SENDER (LOCALHOST TEST TOOL)");
  console.log("============================================================\n");
  console.log("Usage:");
  console.log("   npx tsx scripts/send-test-email.ts --to=you@gmail.com --type=welcome");
  console.log("   npx tsx scripts/send-test-email.ts --to=you@gmail.com --type=rejected --role=owner");
  console.log("   npx tsx scripts/send-test-email.ts --to=you@gmail.com --type=rejected --role=agent");
  console.log("   npx tsx scripts/send-test-email.ts --to=you@gmail.com --type=all\n");
  console.log("Options:");
  console.log("   --to=<email>      Target recipient email address (required to send)");
  console.log("   --type=<type>     Email type to test (see list below)");
  console.log("   --role=<role>     'owner' | 'agent' | 'buyer' (default: owner)");
  console.log("   --reason=<text>   Custom rejection reason (for 'rejected' type)\n");
  console.log("Available Types:");
  for (const t of AVAILABLE_TYPES) {
    console.log(`   • ${t.id.padEnd(15)} : ${t.desc}`);
  }
  console.log("\n============================================================\n");
  process.exit(0);
}

const to = getArg("to");
if (!to) {
  console.error("\x1b[31mError: Missing required argument --to=<email>\x1b[0m");
  console.error("Example: npx tsx scripts/send-test-email.ts --to=yourname@gmail.com --type=welcome\n");
  process.exit(1);
}

const type = (getArg("type") || "welcome").toLowerCase();
const role = (getArg("role") || "owner").toLowerCase();
const reason = getArg("reason") || REJECTION_REASONS[0];

const sample = {
  name: "Test User",
  propertyName: "3 BHK Luxury Apartment",
  location: "Indiranagar, Bangalore",
  reason,
  link: "http://localhost:3000/my-properties",
  agentLink: "http://localhost:3000/agent/my-properties",
  postPropertyLink: "http://localhost:3000/postproperty",
  propertiesLink: "http://localhost:3000/properties",
  plansLink: "http://localhost:3000/plans",
  settingsLink: "http://localhost:3000/settings",
  helpline: process.env.PROPENU_HELPLINE || "+91 9182334233",
  planName: "Prime 30-Day Boost",
  buyerName: "Amit Sharma",
  unsubscribeUrl: "http://localhost:4000/api/users/unsubscribe-email?email=" + encodeURIComponent(to),
};

async function sendSpecificEmail(emailType: string) {
  console.log(`\n🚀 Sending '${emailType}' email to ${to} (role: ${role})...`);

  switch (emailType) {
    case "welcome":
      if (role === "buyer") {
        await sendEmail(to, buyerWelcomeEmailSubject(sample.name), buyerWelcomeEmail(sample.name, sample.propertiesLink, sample.unsubscribeUrl));
      } else {
        await sendEmail(to, ownerWelcomeEmailSubject(sample.name), ownerWelcomeEmail(sample.name, sample.postPropertyLink, sample.unsubscribeUrl));
      }
      break;

    case "submitted":
      await sendListingSubmittedEmail(to, sample.name, sample.propertyName, {
        roleName: role,
        location: sample.location,
        link: role === "agent" ? sample.agentLink : sample.link,
        helplineNumber: sample.helpline,
      });
      break;

    case "live":
      await sendListingApprovedEmail(to, sample.name, sample.propertyName, {
        roleName: role,
        location: sample.location,
        activeUsers: "10,000+",
        link: role === "agent" ? sample.agentLink : sample.link,
      });
      break;

    case "rejected":
      await sendListingRejectedEmail(to, sample.name, sample.propertyName, {
        roleName: role,
        location: sample.location,
        reason: sample.reason,
        link: role === "agent" ? sample.agentLink : sample.link,
        helplineNumber: sample.helpline,
      });
      break;

    case "low-enquiries":
      await sendLowEnquiriesEmail(to, sample.name, sample.propertyName, sample.location, sample.plansLink);
      break;

    case "digest":
      await sendEmail(
        to,
        ownerDailyLeadsDigestEmailSubject(sample.name, sample.propertyName, sample.location),
        ownerDailyLeadsDigestEmail(sample.name, sample.propertyName, sample.location, 5, sample.link, sample.unsubscribeUrl),
      );
      break;

    case "boost":
      await sendBoostActivatedEmail(to, sample.name, sample.propertyName, sample.location, sample.planName, sample.settingsLink);
      break;

    case "failed":
      await sendPaymentFailedEmail(to, sample.name, sample.planName, sample.plansLink, sample.helpline);
      break;

    case "shortlist":
      await sendShortlistedPropertyEmail(to, sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link);
      break;

    case "contact":
      await sendUserContactingEmail(to, sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link);
      break;

    case "callback":
      await sendCallbackRequestEmail(to, sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link);
      break;

    case "deactivated":
      await sendListingDeactivatedEmail(to, sample.name, sample.propertyName, {
        roleName: role,
        location: sample.location,
        link: role === "agent" ? sample.agentLink : sample.link,
        helplineNumber: sample.helpline,
      });
      break;

    default:
      throw new Error(`Unknown email type: ${emailType}`);
  }

  console.log(`\x1b[32m✔ '${emailType}' email sent successfully to ${to}!\x1b[0m`);
}

async function main() {
  try {
    if (type === "all") {
      const typesToSend = AVAILABLE_TYPES.map((t) => t.id).filter((t) => t !== "all");
      console.log(`Sending all ${typesToSend.length} email types to ${to}...`);
      for (const t of typesToSend) {
        await sendSpecificEmail(t);
        // Add brief delay to prevent SMTP rate-limiting
        await new Promise((r) => setTimeout(r, 600));
      }
      console.log("\n\x1b[32m✔ All test emails dispatched successfully!\x1b[0m\n");
    } else {
      await sendSpecificEmail(type);
    }
  } catch (err: any) {
    console.error("\x1b[31m❌ Failed to send email:\x1b[0m", err?.message || err);
    process.exit(1);
  }
}

main();
