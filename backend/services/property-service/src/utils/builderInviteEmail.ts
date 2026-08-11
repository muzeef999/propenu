type BuilderInviteEmailParams = {
  previewUrl: string;
  /** Approve / onboard CTA (falls back to previewUrl in template if omitted) */
  onboardUrl?: string;
  openPixelUrl: string;
  projectTitle: string;
  builderName?: string;
  priceHint?: string;
  brandLogoUrl?: string;
  companyHint?: string;
  locationHint?: string;
  heroImageUrl?: string;
  websiteUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  supportEmail?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  playStoreBadgeUrl?: string;
  appStoreBadgeUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  twitterIconUrl?: string;
  youtubeIconUrl?: string;
  userIconUrl?: string;
  phoneIconUrl?: string;
  emailIconUrl?: string;
  giftIconUrl?: string;
  contactUrl?: string;
  teamworksUrl?: string;
  aslijobsUrl?: string;
  teamworksLogoUrl?: string;
  aslijobsLogoUrl?: string;
};

export const builderInviteEmailSubject =
  "Invitation to Join Propenu's Launch Partners Program";

export function buildBuilderInviteEmailHtml(
  params: BuilderInviteEmailParams,
): string {
  const {
    previewUrl,
    onboardUrl,
    openPixelUrl,
    projectTitle,
    builderName,
    priceHint,
    brandLogoUrl,
    companyHint,
    locationHint,
    heroImageUrl,
    websiteUrl,
    termsUrl,
    privacyUrl,
    supportEmail,
    playStoreUrl,
    appStoreUrl,
    playStoreBadgeUrl,
    appStoreBadgeUrl,
    linkedinUrl,
    instagramUrl,
    facebookUrl,
    twitterUrl,
    youtubeUrl,
    linkedinIconUrl,
    instagramIconUrl,
    facebookIconUrl,
    twitterIconUrl,
    youtubeIconUrl,
    userIconUrl,
    phoneIconUrl,
    emailIconUrl,
    giftIconUrl,
    contactUrl,
    teamworksUrl,
    aslijobsUrl,
    teamworksLogoUrl,
    aslijobsLogoUrl,
  } = params;

  const approveUrl = onboardUrl || previewUrl;

  const greeting = builderName
    ? `Dear ${builderName} Team,`
    : companyHint
    ? `Dear ${companyHint} Team,`
    : `Dear ${projectTitle} Team,`;

  const safeWebsiteUrl = websiteUrl || "https://www.propenu.com";
  const safeTermsUrl = termsUrl || `${safeWebsiteUrl}/terms`;
  const safePrivacyUrl = privacyUrl || `${safeWebsiteUrl}/privacy-policy`;
  const safeSupportEmail = supportEmail || "marketingteam@propenu.com";
  const safePlayStoreUrl = playStoreUrl || safeWebsiteUrl;
  const safeAppStoreUrl = appStoreUrl || safeWebsiteUrl;
  const safePlayStoreBadgeUrl =
    playStoreBadgeUrl || `${safeWebsiteUrl}/email/playstoreBadge.png`;
  const safeAppStoreBadgeUrl =
    appStoreBadgeUrl || `${safeWebsiteUrl}/email/appleBadge.png`;
  const safeBrandLogoUrl =
    brandLogoUrl || `${safeWebsiteUrl}/email/propenu-logo.png`;
  const safeLinkedinUrl = linkedinUrl || safeWebsiteUrl;
  const safeInstagramUrl = instagramUrl || safeWebsiteUrl;
  const safeFacebookUrl = facebookUrl || safeWebsiteUrl;
  const safeTwitterUrl = twitterUrl || safeWebsiteUrl;
  const safeYoutubeUrl = youtubeUrl || safeWebsiteUrl;
  const safeContactUrl = contactUrl || safeWebsiteUrl;
  const safeTeamworksUrl = teamworksUrl || safeWebsiteUrl;
  const safeAslijobsUrl = aslijobsUrl || safeWebsiteUrl;
  const safeLinkedinIconUrl =
    linkedinIconUrl || `${safeWebsiteUrl}/email/linkedin.png`;
  const safeInstagramIconUrl =
    instagramIconUrl || `${safeWebsiteUrl}/email/instagram.png`;
  const safeFacebookIconUrl =
    facebookIconUrl || `${safeWebsiteUrl}/email/facebook.png`;
  const safeTwitterIconUrl =
    twitterIconUrl || `${safeWebsiteUrl}/email/twitter.png`;
  const safeYoutubeIconUrl =
    youtubeIconUrl || `${safeWebsiteUrl}/email/youtube.png`;
  const safeUserIconUrl = userIconUrl || `${safeWebsiteUrl}/email/Usericon.png`;
  const safePhoneIconUrl =
    phoneIconUrl || `${safeWebsiteUrl}/email/Phoneicon.png`;
  const safeEmailIconUrl =
    emailIconUrl || `${safeWebsiteUrl}/email/emailicon.png`;
  const safeGiftIconUrl =
    giftIconUrl || `${safeWebsiteUrl}/email/giftIcon.png`;
  const safeTeamworksLogoUrl =
    teamworksLogoUrl || `${safeWebsiteUrl}/email/teamworks.png`;
  const safeAslijobsLogoUrl =
    aslijobsLogoUrl || `${safeWebsiteUrl}/email/aslijobs.png`;


  const locationLine = locationHint
    ? `<div style="margin-top:6px;font-size:12px;color:#16a34a;font-weight:700;">${locationHint}</div>`
    : "";

  const companyLine = companyHint
    ? `<div style="margin-top:6px;font-size:13px;color:#64748b;">For ${companyHint}</div>`
    : "";

  const priceLine = priceHint
    ? `<div style="margin-top:10px;font-size:18px;color:#0f172a;font-weight:800;">${priceHint}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#edf3ef;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#edf3ef;padding:20px 10px;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #d9e6dd;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:18px 24px 14px;border-bottom:1px solid #e7efe9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${safeBrandLogoUrl}" alt="Propenu" width="132" style="display:block;width:132px;max-width:132px;height:auto;border:0;" />
                  </td>
                  <td align="right" valign="middle" style="font-size:11px;color:#94a3b8;">
                    <a href="${safeWebsiteUrl}" style="color:#94a3b8;text-decoration:none;">www.propenu.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 10px;">
              <p style="margin:0 0 14px;font-size:14px;color:#0f172a;">${greeting}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#475569;">
                Greetings from Propenu.
              </p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#475569;">
                We are pleased to invite your esteemed organization to become a
                <span style="color:#16a34a;font-weight:700;">Propenu Launch Partner</span>
                as we introduce Propenu, a trust-first real estate platform designed to help development and sales projects gain better visibility, connect with verified homebuyers, and streamline lead management through an integrated digital ecosystem.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:2px 28px 12px;">
              <p style="margin:0 0 12px;font-size:26px;line-height:1.3;font-weight:700;color:#1f2937;">
                As part of our Launch Partnership Program, we are offering
              </p>
              <table cellpadding="0" cellspacing="0" style="background:#f0fbf4;border:1px solid #d5efdc;border-radius:10px;">
                <tr>
                  <td style="padding:10px 12px 10px 14px;" valign="middle">
                    <img src="${safeGiftIconUrl}" alt="Gift" width="22" height="22" style="display:block;width:22px;height:22px;border:0;" />
                  </td>
                  <td style="padding:10px 14px 10px 0;font-size:13px;line-height:1.6;color:#166534;" valign="middle">
                    <span style="font-weight:700;">Complimentary onboarding and project activation</span>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
                for a limited introductory period. This invitation is extended to a select number of developers during our launch phase, providing an opportunity to establish an early presence on the platform.
              </p>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
                As part of the onboarding process, our team has already prepared a dedicated project page for your review.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3faf6;border:1px solid #dbeee3;border-left:4px solid #22c55e;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px 8px;font-size:18px;font-weight:700;color:#1f2937;">
                    Project Preview
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                      <tr>
                        <td width="160" valign="top" style="background:#dbeafe;">
                          ${
                            heroImageUrl
                              ? `<img src="${heroImageUrl}" alt="${projectTitle}" width="160" style="display:block;width:160px;max-width:160px;height:120px;object-fit:cover;border:0;" />`
                              : `<div style="width:160px;height:120px;background:#dbeafe;color:#0f172a;font-size:16px;font-weight:700;text-align:center;line-height:120px;">Project</div>`
                          }
                        </td>
                        <td valign="top" style="padding:14px 16px;">
                          <div style="font-size:20px;font-weight:700;line-height:1.3;color:#1f2937;">${projectTitle}</div>
                          ${companyLine}
                          ${locationLine}
                          ${priceLine}
                          <div style="margin-top:14px;">
                            <a href="${previewUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:700;">View Project</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 14px;">
              <p style="margin:0 0 10px;font-size:18px;font-weight:700;color:#1f2937;">
                Upon activation, your organization will benefit from:
              </p>
              <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:#475569;">
                <li>Enhanced digital visibility for your projects</li>
                <li>Access to the Propenu CRM Dashboard for centralized lead management</li>
                <li>Delivery of verified buyer enquiries directly to your sales team</li>
                <li>Dedicated onboarding and platform support from the Propenu team</li>
              </ul>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 14px;">
              <p style="margin:0 0 10px;font-size:18px;font-weight:700;color:#1f2937;">
                To proceed with the activation, we kindly request you to:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#475569;">1. Review the project page and share any corrections or updates, if required.</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#475569;">2. Confirm your approval to publish the project on Propenu.</td>
                </tr>
                <tr>
                  <td style="padding:4px 0 8px;font-size:13px;color:#475569;">3. Share the following onboarding details:</td>
                </tr>
                <tr>
                  <td style="padding-left:18px;font-size:13px;line-height:1.8;color:#166534;">
                    <div style="margin:0 0 6px;">
                      <img src="${safeUserIconUrl}" alt="User" width="16" height="16" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:6px;border:0;" />
                      <span style="color:#1f2937;">Primary Contact Person</span>
                    </div>
                    <div style="margin:0 0 6px;">
                      <img src="${safePhoneIconUrl}" alt="Phone" width="16" height="16" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:6px;border:0;" />
                      <span style="color:#1f2937;">Mobile Number</span>
                    </div>
                    <div>
                      <img src="${safeEmailIconUrl}" alt="Email" width="16" height="16" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:6px;border:0;" />
                      <span style="color:#1f2937;">Email ID</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:4px 28px 12px;">
              <a href="${approveUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:700;">
                Start activation
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 18px;font-size:13px;line-height:1.75;color:#475569;">
              <p style="margin:0 0 12px;">
                The above details will be used to configure your organization's Propenu CRM Dashboard, enabling your team to seamlessly receive, manage, and track verified buyer enquiries generated through the platform.
              </p>
              <p style="margin:0 0 12px;">
                We believe this partnership will strengthen your digital presence while providing your sales team with an additional channel to engage qualified homebuyers and efficiently manage enquiries.
              </p>
              <p style="margin:0 0 12px;">
                We look forward to your approval and to welcoming your organization as one of Propenu's Launch Partners.
              </p>
              <p style="margin:0;">
                We should you require any further information or wish to schedule a brief discussion, our team would be pleased to assist.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 18px;font-size:13px;color:#475569;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" align="left" style="padding:0;">
                    <p style="margin:0 0 4px;">Warm regards,</p>
                    <p style="margin:0 0 4px;font-weight:700;color:#1f2937;">Propenu Team</p>
                    <p style="margin:0;color:#16a34a;">
                      <img src="${safeEmailIconUrl}" alt="Email" width="16" height="16" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:6px;border:0;" />${safeSupportEmail}
                    </p>
                  </td>
                  <td valign="top" align="right" style="padding:0;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1f2937;">Follow Us</p>
                    <table cellpadding="0" cellspacing="0" align="right">
                      <tr>
                        <td style="padding:0 8px 0 0;">
                          <a href="${safeLinkedinUrl}" style="display:inline-block;text-decoration:none;">
                            <img src="${safeLinkedinIconUrl}" alt="LinkedIn" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" />
                          </a>
                        </td>
                        <td style="padding:0 8px 0 0;">
                          <a href="${safeInstagramUrl}" style="display:inline-block;text-decoration:none;">
                            <img src="${safeInstagramIconUrl}" alt="Instagram" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" />
                          </a>
                        </td>
                        <td style="padding:0 8px 0 0;">
                          <a href="${safeFacebookUrl}" style="display:inline-block;text-decoration:none;">
                            <img src="${safeFacebookIconUrl}" alt="Facebook" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" />
                          </a>
                        </td>
                        <td style="padding:0 8px 0 0;">
                          <a href="${safeTwitterUrl}" style="display:inline-block;text-decoration:none;">
                            <img src="${safeTwitterIconUrl}" alt="Twitter" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" />
                          </a>
                        </td>
                        <td style="padding:0;">
                          <a href="${safeYoutubeUrl}" style="display:inline-block;text-decoration:none;">
                            <img src="${safeYoutubeIconUrl}" alt="YouTube" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px;background:#f7faf8;border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#2fb35f;border-radius:8px;">
                <tr>
                  <td align="left" style="padding:16px 18px;font-size:18px;font-weight:700;color:#ffffff;">
                    Download the Propenu App
                  </td>
                  <td align="right" style="padding:10px 18px;white-space:nowrap;">
                    <a href="${safePlayStoreUrl}" style="display:inline-block;text-decoration:none;">
                      <img src="${safePlayStoreBadgeUrl}" alt="Get it on Google Play" width="140" style="display:block;width:140px;max-width:140px;height:auto;border:0;" />
                    </a>
                  </td>
                  <td align="right" style="padding:10px 18px 10px 0;white-space:nowrap;">
                    <a href="${safeAppStoreUrl}" style="display:inline-block;text-decoration:none;">
                      <img src="${safeAppStoreBadgeUrl}" alt="Download on the App Store" width="140" style="display:block;width:140px;max-width:140px;height:auto;border:0;" />
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td align="left" style="font-size:11px;color:#94a3b8;">
                    <a href="${safeTermsUrl}" style="color:#94a3b8;text-decoration:none;">Terms &amp; Conditions</a>
                  </td>
                  <td align="center" style="font-size:11px;color:#94a3b8;">
                    <a href="${safePrivacyUrl}" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a>
                  </td>
                  <td align="right" style="font-size:11px;color:#94a3b8;">
                    <a href="${safeContactUrl}" style="color:#94a3b8;text-decoration:none;">Contact Us</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                <tr>
                  <td align="center">
                    <a href="${safeTeamworksUrl}" style="display:inline-block;margin-right:16px;text-decoration:none;vertical-align:middle;">
                      <img src="${safeTeamworksLogoUrl}" alt="Teamworks" width="110" style="display:block;width:110px;max-width:110px;height:auto;border:0;" />
                    </a>
                    <a href="${safeAslijobsUrl}" style="display:inline-block;text-decoration:none;vertical-align:middle;">
                      <img src="${safeAslijobsLogoUrl}" alt="Asli Jobs" width="110" style="display:block;width:110px;max-width:110px;height:auto;border:0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;font-size:12px;color:#475569;">
                    Associated Businesses
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-size:10px;line-height:1.6;color:#94a3b8;text-align:center;">
                &copy; Propenu Solutions Private Limited<br />
                This email was sent as part of an onboarding invitation for your organization.
              </p>
            </td>
          </tr>
        </table>
        <img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildBuilderOtpEmailHtml(
  otp: string,
  projectTitle: string,
): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#edf3ef;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="460" cellpadding="0" cellspacing="0" style="width:100%;max-width:460px;background:#ffffff;border:1px solid #d9e6dd;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e7efe9;">
              <div style="font-size:20px;font-weight:800;color:#16a34a;">Propenu</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#1f2937;">Verification Code</h2>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#64748b;">
                Use this 4-digit OTP to verify onboarding for <strong>${projectTitle}</strong>.
              </p>
              <div style="margin:22px 0;padding:18px 20px;border-radius:14px;background:#f0fbf4;border:1px solid #d5efdc;text-align:center;">
                <span style="font-size:34px;letter-spacing:10px;font-weight:800;color:#16a34a;">${otp}</span>
              </div>
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Expires in 10 minutes &middot; 4 digits only
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
