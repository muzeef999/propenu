import { sendMail } from "./mailer";

export async function sendManagerApprovalMail({
  managerEmail,
  propertyId,
  token,
}) {
  const approveUrl =
    `${process.env.FRONTEND_URL}/approve/${propertyId}?token=${token}`;

  await sendMail(
    managerEmail,
    "Property Approval Required",
    `
      <h3>New Property Waiting For Approval</h3>
      <p>Please review and approve.</p>
      <a href="${approveUrl}">Approve Property</a>
    `
  );
}
