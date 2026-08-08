type BuilderInviteEmailParams = {
  previewUrl: string;
  onboardUrl: string;
  openPixelUrl: string;
  projectTitle: string;
  companyHint?: string;
  locationHint?: string;
  heroImageUrl?: string;
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
    locationHint,
    heroImageUrl,
  } = params;

  const greeting = companyHint
    ? `Dear ${companyHint} Team,`
    : "Dear Sir/Madam,";

  const imageBlock = heroImageUrl
    ? `<tr>
              <td style="padding:0 28px 16px;">
                <img src="${heroImageUrl}" alt="${projectTitle}" width="560" style="display:block;width:100%;max-width:560px;height:180px;object-fit:cover;border-radius:14px;border:0;" />
              </td>
            </tr>`
    : "";

  const locationBlock = locationHint
    ? `<p style="margin:0 0 4px;font-size:13px;color:#27AE60;font-weight:600;">📍 ${locationHint}</p>`
    : "";

  const companyBlock = companyHint
    ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">By ${companyHint}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f4;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:22px 28px 8px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:#27AE60;border-radius:10px;color:#ffffff;font-weight:800;text-align:center;vertical-align:middle;font-size:18px;">P</td>
                  <td style="padding-left:10px;">
                    <div style="font-size:15px;font-weight:800;letter-spacing:0.04em;color:#0f172a;">PROPENU</div>
                    <div style="font-size:11px;color:#64748b;">Simplify. Connect. Grow.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 6px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#27AE60;">Propenu Launch Partner</p>
              <h1 style="margin:6px 0 0;font-size:26px;line-height:1.25;color:#0f172a;">You've been invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 28px 8px;font-size:14px;line-height:1.6;color:#475569;">
              <p style="margin:0 0 12px;">${greeting}</p>
              <p style="margin:0 0 12px;">
                Greetings from <strong>Propenu Solutions Pvt. Ltd.</strong> Review your project below,
                then approve to complete contact details and builder verification in one continuous flow.
              </p>
            </td>
          </tr>
          ${imageBlock}
          <tr>
            <td style="padding:0 28px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid #e5e7eb;border-radius:16px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#0f172a;">${projectTitle}</p>
                    ${companyBlock}
                    ${locationBlock}
                    <p style="margin:10px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
                      Complimentary onboarding and project activation for Propenu Launch Partners.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 10px;" align="center">
              <a href="${onboardUrl}"
                 style="display:inline-block;background:#27AE60;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;min-width:220px;text-align:center;">
                ✓ Approve
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;" align="center">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Continues in your invite experience — contact → mobile → 4-digit OTP → approve
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 22px;" align="center">
              <a href="${previewUrl}" style="font-size:13px;font-weight:700;color:#27AE60;text-decoration:underline;">
                View project preview
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;background:#f8faf9;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">All steps continue from this invite</p>
              <p style="margin:0;font-size:12px;color:#64748b;">No separate dashboard login required to finish approval.</p>
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
<body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;background:#eef1f4;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="420" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:24px;">
          <tr>
            <td>
              <h2 style="margin:0 0 12px;font-size:20px;">Propenu verification code</h2>
              <p style="margin:0 0 12px;color:#64748b;font-size:14px;">
                Use this 4-digit OTP to verify onboarding for <strong>${projectTitle}</strong>.
              </p>
              <p style="font-size:32px;letter-spacing:10px;font-weight:800;margin:20px 0;color:#27AE60;text-align:center;">${otp}</p>
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Expires in 10 minutes · 4 digits only</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
