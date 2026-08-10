import fs from "fs";
import path from "path";
import {
  buildBuilderInviteEmailHtml,
  buildBuilderOtpEmailHtml,
} from "../src/utils/builderInviteEmail";

const outputDir = path.resolve(__dirname, "previews");

fs.mkdirSync(outputDir, { recursive: true });

const inviteHtml = buildBuilderInviteEmailHtml({
  previewUrl: "http://localhost:3000/project/hindu-puja-villas-kondapur",
  onboardUrl:
    "http://localhost:3000/project/hindu-puja-villas-kondapur?invite=sample-token",
  openPixelUrl: "http://localhost:4000/api/properties/public/email/open/sample.gif",
  projectTitle: "Hindu Puja Villas",
  brandLogoUrl: "http://localhost:3000/email/propenu-logo.png",
  companyHint: "Aparna",
  locationHint: "Kondapur, Telangana",
  heroImageUrl:
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  websiteUrl: "http://localhost:3000",
  termsUrl: "http://localhost:3000/terms",
  privacyUrl: "http://localhost:3000/privacy-policy",
  supportEmail: "marketingteam@propenu.com",
  playStoreUrl: "https://play.google.com/store",
  appStoreUrl: "https://apps.apple.com",
  playStoreBadgeUrl: "http://localhost:3000/email/playstoreBadge.png",
  appStoreBadgeUrl: "http://localhost:3000/email/appleBadge.png",
  linkedinUrl: "https://www.linkedin.com",
  instagramUrl: "https://www.instagram.com",
  facebookUrl: "https://www.facebook.com",
  twitterUrl: "https://x.com",
  youtubeUrl: "https://www.youtube.com",
  linkedinIconUrl: "http://localhost:3000/email/linkedin.png",
  instagramIconUrl: "http://localhost:3000/email/instagram.png",
  facebookIconUrl: "http://localhost:3000/email/facebook.png",
  twitterIconUrl: "http://localhost:3000/email/twitter.png",
  youtubeIconUrl: "http://localhost:3000/email/youtube.png",
  contactUrl: "http://localhost:3000/contact",
  teamworksUrl: "http://localhost:3000",
  aslijobsUrl: "http://localhost:3000",
  teamworksLogoUrl: "http://localhost:3000/email/teamworks.png",
  aslijobsLogoUrl: "http://localhost:3000/email/aslijobs.png",
});

const otpHtml = buildBuilderOtpEmailHtml("6546", "Hindu Puja Villas");

const invitePath = path.join(outputDir, "builder-invite-preview.html");
const otpPath = path.join(outputDir, "builder-otp-preview.html");

fs.writeFileSync(invitePath, inviteHtml, "utf8");
fs.writeFileSync(otpPath, otpHtml, "utf8");

console.log(`Invite preview written to: ${invitePath}`);
console.log(`OTP preview written to: ${otpPath}`);
