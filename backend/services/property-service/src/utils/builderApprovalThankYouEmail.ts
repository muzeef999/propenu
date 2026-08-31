type BuilderApprovalThankYouEmailParams = {
  builderName?: string;
  projectTitle: string;
  projectUrl: string;
  brandLogoUrl?: string;
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
  emailIconUrl?: string;
  contactUrl?: string;
  teamworksUrl?: string;
  aslijobsUrl?: string;
  teamworksLogoUrl?: string;
  aslijobsLogoUrl?: string;
};

export const buildBuilderApprovalThankYouSubject = (builderName?: string) =>
  `Thank You for Your Approval${builderName ? ` ${builderName}` : ""} - Propenu`;

export function buildBuilderApprovalThankYouEmailHtml(
  params: BuilderApprovalThankYouEmailParams,
): string {
  const {
    builderName,
    projectTitle,
    projectUrl,
    brandLogoUrl,
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
    emailIconUrl,
    contactUrl,
    teamworksUrl,
    aslijobsUrl,
    teamworksLogoUrl,
    aslijobsLogoUrl,
  } = params;

  const greeting = builderName ? `Dear ${builderName} Team,` : "Dear Sir/Madam,";
  const safeWebsiteUrl = websiteUrl || "https://www.propenu.com";
  const safeTermsUrl = termsUrl || `${safeWebsiteUrl}/terms`;
  const safePrivacyUrl = privacyUrl || `${safeWebsiteUrl}/privacy-policy`;
  const safeSupportEmail = supportEmail || "marketingteam@propenu.com";
  const safePlayStoreUrl =
    playStoreUrl || "https://play.google.com/store/apps/details?id=com.propenu.app";
  const safeAppStoreUrl =
    appStoreUrl || "https://apps.apple.com/in/app/propenu/id6762111856";
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
  const safeTeamworksUrl = teamworksUrl || "https://www.eteamworks.com";
  const safeAslijobsUrl = aslijobsUrl || "https://www.aslijobs.com";
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
  const safeEmailIconUrl =
    emailIconUrl || `${safeWebsiteUrl}/email/emailicon.png`;
  const safeTeamworksLogoUrl =
    teamworksLogoUrl || `${safeWebsiteUrl}/email/teamworks.png`;
  const safeAslijobsLogoUrl =
    aslijobsLogoUrl || `${safeWebsiteUrl}/email/aslijobs.png`;

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
            <td style="padding:28px 28px 16px;">
              <p style="margin:0 0 16px;font-size:14px;color:#0f172a;">${greeting}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#1f2937;font-weight:700;">Greetings From Propenu</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#475569;">
                Thank you for reviewing and approving your project for activation on Propenu.
              </p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#475569;">
                We are pleased to welcome <span style="font-weight:700;color:#1f2937;">${builderName || "your organization"}</span> as our <span style="font-weight:700;color:#1f2937;">Launch Partner</span>. Your project <span style="font-weight:700;color:#1f2937;">${projectTitle}</span> has been successfully activated on Propenu and is now ready to reach verified homebuyers through our platform.
              </p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#475569;">
                You can now access your project and manage your enquiries through the Propenu CRM.
              </p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#475569;">
                If you have any questions or need assistance, please feel free to reach out to us at <span style="font-weight:700;color:#1f2937;">${safeSupportEmail}</span>.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#475569;">
                We look forward to a successful association.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">
                To view the live project
                <a href="${projectUrl}" style="color:#2563eb;text-decoration:underline;">click here</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" align="left" style="padding:0;font-size:13px;color:#475569;">
                    <p style="margin:0 0 4px;">Warm regards,</p>
                    <p style="margin:0 0 4px;font-weight:700;color:#1f2937;">Propenu Team</p>
                    <p style="margin:0;color:#16a34a;">
                      <img src="${safeEmailIconUrl}" alt="Email" width="16" height="16" style="display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:6px;border:0;" />${safeSupportEmail}
                    </p>
                  </td>
                  <td valign="top" align="right" style="padding:0;font-size:13px;color:#1f2937;">
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
                This email was sent as part of the Propenu launch partnership program.
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
