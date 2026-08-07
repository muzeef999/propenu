type BuilderInviteEmailParams = {
  previewUrl: string;
  onboardUrl: string;
  openPixelUrl: string;
  projectTitle: string;
  companyHint?: string;
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
    companyHint,
  } = params;

  const greeting = companyHint
    ? `Dear ${companyHint} Team,`
    : "Dear Sir/Madam,";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;font-size:20px;font-weight:700;color:#0f172a;">
              Propenu Launch Partners Invitation
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 14px;">${greeting}</p>
              <p style="margin:0 0 14px;">
                Greetings from <strong>Propenu Solutions Pvt. Ltd.</strong>
              </p>
              <p style="margin:0 0 14px;">
                We are pleased to invite your esteemed organization to become a Propenu Launch Partner
                as we introduce Propenu — a trust-first real estate platform designed to help developers
                enhance project visibility, connect with verified homebuyers, and streamline lead management.
              </p>
              <p style="margin:0 0 14px;">
                As part of our Launch Partnership Program, we are offering
                <strong>Complimentary Onboarding and Project Activation</strong>
                for a limited introductory period.
              </p>
              <p style="margin:0 0 8px;">
                Our team has already prepared a dedicated project page for your review:
              </p>
              <p style="margin:0 0 6px;"><strong>Project:</strong> ${projectTitle}</p>
              <p style="margin:0 0 18px;">
                <a href="${previewUrl}" style="color:#0b6bcb;word-break:break-all;">${previewUrl}</a>
              </p>
              <p style="margin:0 0 10px;">Upon activation, your organization will benefit from:</p>
              <ul style="margin:0 0 18px;padding-left:18px;">
                <li>Enhanced digital visibility for your project</li>
                <li>Access to the Propenu CRM Dashboard for centralized lead management</li>
                <li>Delivery of Verified Buyer Enquiries directly to your sales team</li>
                <li>Dedicated onboarding and platform support from the Propenu team</li>
              </ul>
              <p style="margin:0 0 10px;">To proceed with activation, please:</p>
              <ol style="margin:0 0 18px;padding-left:18px;">
                <li>Review the project page and share corrections/updates, if any</li>
                <li>Confirm your approval to publish the project on Propenu</li>
                <li>Share Primary Contact Person, Mobile Number, and Official Email Address</li>
              </ol>
              <p style="margin:0 0 12px;">
                <a href="${previewUrl}"
                   style="display:inline-block;background:#ffffff;color:#0b6bcb;border:2px solid #0b6bcb;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;margin-right:8px;">
                  View Project Preview
                </a>
                <a href="${onboardUrl}"
                   style="display:inline-block;background:#27AE60;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
                  Approve &amp; Onboard
                </a>
              </p>
              <p style="margin:0 0 14px;">
                These details will be used to configure your organization’s Propenu CRM Dashboard
                so your team can receive, manage, and track verified buyer enquiries.
              </p>
              <p style="margin:0 0 14px;">
                We look forward to your approval and to welcoming your organization as one of Propenu’s Launch Partners.
              </p>
              <p style="margin:0 0 4px;">Warm regards,</p>
              <p style="margin:0 0 2px;"><strong>Marketing Team</strong></p>
              <p style="margin:0 0 2px;">Propenu Solutions Pvt. Ltd.</p>
              <p style="margin:0;">
                <a href="https://www.propenu.com" style="color:#0b6bcb;">https://www.propenu.com</a>
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

export function buildBuilderOtpEmailHtml(otp: string, projectTitle: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;padding:24px;">
  <h2 style="margin:0 0 12px;">Propenu Builder Verification OTP</h2>
  <p style="margin:0 0 12px;">Use this OTP to verify onboarding for <strong>${projectTitle}</strong>.</p>
  <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:16px 0;">${otp}</p>
  <p style="margin:0;color:#6b7280;font-size:13px;">This OTP expires in 10 minutes.</p>
</body>
</html>`;
}
