import fs from "fs";
import path from "path";
import {
  buildBuilderInviteEmailHtml,
  buildBuilderOtpEmailHtml,
} from "../src/utils/builderInviteEmail";

const outputDir = path.resolve(__dirname, "previews");

fs.mkdirSync(outputDir, { recursive: true });

const inviteHtml = buildBuilderInviteEmailHtml({
  previewUrl: "https://www.propenu.com/project/hindu-puja-villas-kondapur",
  onboardUrl:
    "https://www.propenu.com/project/hindu-puja-villas-kondapur?invite=sample-token",
  openPixelUrl: "https://www.propenu.com/api/properties/public/email/open/sample.gif",
  projectTitle: "Hindu Puja Villas",
  companyHint: "Aparna",
  locationHint: "Kondapur, Telangana",
  heroImageUrl:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  websiteUrl: "https://www.propenu.com",
  termsUrl: "https://www.propenu.com/terms",
  privacyUrl: "https://www.propenu.com/privacy-policy",
  supportEmail: "marketingteam@propenu.com",
  playStoreUrl: "https://play.google.com/store",
  appStoreUrl: "https://apps.apple.com",
  playStoreBadgeUrl: "https://www.propenu.com/email/playstoreBadge.png",
  appStoreBadgeUrl: "https://www.propenu.com/email/appleBadge.png",
});

const otpHtml = buildBuilderOtpEmailHtml("6546", "Hindu Puja Villas");

const invitePath = path.join(outputDir, "builder-invite-preview.html");
const otpPath = path.join(outputDir, "builder-otp-preview.html");

fs.writeFileSync(invitePath, inviteHtml, "utf8");
fs.writeFileSync(otpPath, otpHtml, "utf8");

console.log(`Invite preview written to: ${invitePath}`);
console.log(`OTP preview written to: ${otpPath}`);
