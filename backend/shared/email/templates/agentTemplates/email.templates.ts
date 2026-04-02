export const agentWelcomeEmailSubject = (name: string) =>
    `${name}, Welcome to Propenu — You’re Verified`;

export const agentWelcomeEmail = (
    name: string,
    link: string = "https://propenu.com/postproperty",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Welcome to Propenu 🎉</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Welcome to <b>Propenu</b> — your verification is now complete.
  </p>

  <p>
    You’re officially part of a platform built on turst with: verified users, verified properties, zero spam, and secure transactions.
  </p>

  <p>
    You can now post your property and move ahead with confidence on Propenu.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Click here to start posting your property
    </a>
  </div>

  <p>
    We’re excited to have you with us and wish you great success on the platform.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentSubscriptionRequiredEmailSubject = (
    name: string,
) => `${name}, Activate Your Subscription to Start Posting`;

export const agentSubscriptionRequiredEmail = (
    name: string,
    link: string = "https://propenu.com/plans/pricing/agent-plan",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Subscription Required</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    To start posting properties on Propenu, please activate your subscription plan. Once subscribed, you can list properties and begin connecting with genuine buyers/tenants.
  </p>

  <p>
    Your next listing opportunity is just one step away — choose a plan and get started today.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Activate Subscription Now
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentSubscriptionActivatedEmailSubject = (
    name: string,
    subscriptionName: string,
) => `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;

export const agentSubscriptionActivatedEmail = (
    name: string,
    subscriptionName: string,
    invoiceLink: string = "https://propenu.com/agent/account-settings",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Payment Successful & Subscription Activated</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your payment has been successfully processed, and your <b>${subscriptionName}</b> subscription is now active on Propenu.
  </p>

  <p>
    You can now enjoy uninterrupted access to your plan features.
  </p>

  <p>
    You can download your invoice below.
  </p>

  <div style="margin:20px 0;">
    <a href="${invoiceLink}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Download your invoice here
    </a>
  </div>

  <p>
    Thank you for choosing Propenu.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentPaymentFailedEmailSubject = (
    name: string,
    subscriptionName: string,
) => `${name}, Payment Failed — Retry Your ${subscriptionName} Subscription`;

export const agentPaymentFailedEmail = (
    name: string,
    link: string = "https://propenu.com/plans/pricing/agent-plan",
    helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Payment Failed</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    We were unable to process your payment on Propenu.
  </p>

  <p>
    <strong>Payment rejection or unsccessful</strong>
  </p>

  <p>
    No charges have been made. Please try again to complete your purchase.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Retry Payment to Complete Your Purchase
    </a>
  </div>

  <p>
    If the issue persists, you may try a different payment method or reach out to our support team for assistance at <b>${helplineNumber}</b>.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentIncompleteListingEmailSubject = (name: string) =>
    `${name}, Complete Your Property Listing`;

export const agentIncompleteListingEmail = (
    name: string,
    activeUsers: string,
    link: string = "https://propenu.com/postproperty",
    helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Complete Your Listing</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    You’re just a few steps away from posting your property on Propenu.
  </p>

  <p>
    Your listing is still incomplete. Finish the remaining details to submit your property for verification and make it visible to <b>${activeUsers}</b> active, genuine buyers/tenants searching on the platform.
  </p>

  <p>
    Your property could be exactly what they’re looking for.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Complete Your Listing to Submit for Verification
    </a>
  </div>

  <p>
    If you have any questions, feel free to reach out to our support team at <b>${helplineNumber}</b>.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentListingSubmittedEmailSubject = (
    name: string,
    propertyName: string,
    location: string,
) =>
    `${name}, Your ${propertyName} in ${location} Has Been Submitted Successfully`;

export const agentListingSubmittedEmail = (
    name: string,
    propertyName: string,
    location: string,
    link: string = "https://propenu.com/postproperty",
    helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Listing Submitted Successfully</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> in <b>${location}</b> has been successfully submitted on Propenu.
  </p>

  <p>
    Our team is currently reviewing your listing as part of the verification process.
  </p>

  <p>
    Property verification is typically completed within 24 hours. In rare cases, the process may take slightly longer than 24 hours. Once approved, your property will go live and become visible to genuine buyers/tenants.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 View Listing to Track Its Status
    </a>
  </div>

  <p>
    Thank you for listing with Propenu.
  </p>

  <p>
    If you have any questions, feel free to reach out to our support team at <b>${helplineNumber}</b>.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentListingApprovedEmailSubject = (
    name: string,
    propertyName: string,
    location: string,
) => `${name}, Your ${propertyName} in ${location} is Now Live on Propenu`;

export const agentListingApprovedEmail = (
    name: string,
    propertyName: string,
    activeUsers: string,
    link: string,
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Listing Approved & Live</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Great news — your <b>${propertyName}</b> on Propenu has been successfully approved and is now live on the platform.
  </p>

  <p>
    Your verified listing is now visible to genuine buyers/tenants actively searching in your area. You can expect quality enquiries from interested prospects.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 View Your Listing and Start Receiving Enquiries
    </a>
  </div>

  <p>
    Thank you for choosing Propenu.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentListingRejectedEmailSubject = (
    name: string,
    propertyName: string,
) =>
    `${name}, Verification Failed for Your ${propertyName} — Please Update`;

export const agentListingRejectedEmail = (
    name: string,
    propertyName: string,
    reason: string,
    link: string = "https://propenu.com/postproperty",
    helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Verification Failed for Your Listing</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> on Propenu could not be approved.
  </p>

  <p>
    <b>Reason:</b> ${reason}
  </p>

  <p>
    Please update the required details and resubmit your listing to proceed with verification.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Update Your Listing and Resubmit for Review
    </a>
  </div>

  <p>
    Our team will review it again once updated. Verification is usually completed within 24 hours, though in rare cases it may take slightly longer.
  </p>

  <p>
    If you have any questions, feel free to reach out to our support team at <b>${helplineNumber}</b>.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>
</div>`;

export const agentSubscriptionExpiryEmailSubject = (
    name: string,
    subscriptionName: string,
) => `${name}, Your ${subscriptionName} subscription is Expiring Soon`;

export const agentSubscriptionExpiryEmail = (
    name: string,
    subscriptionName: string,
    link: string = "https://propenu.com/plans/pricing/agent-plan",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Subscription Expiring Soon</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${subscriptionName}</b> subscription is set to expire soon.
  </p>

  <p>
    Renew now to continue enjoying all subscription features and enhanced exposure on Propenu. Avoid any disruption to your active listings.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Renew Your Subscription to Continue Your Benefits
    </a>
  </div>

  <p>
    Stay visible. Stay ahead.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentSubscriptionEndedEmailSubject = (
    name: string,
    subscriptionName: string,
) => `${name}, Your ${subscriptionName} subscription Has Ended`;

export const agentSubscriptionEndedEmail = (
    name: string,
    subscriptionName: string,
    link: string = "https://propenu.com/plans/pricing/agent-plan",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Subscription Ended</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${subscriptionName}</b> subscription has ended.
  </p>

  <p>
    To continue enjoying premium visibility, uninterrupted enquiries, and full access to your plan features, please renew your subscription.
  </p>

  <p>
    (Display all subscription plans here)
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Renew Your Subscription to Continue Your Benefits
    </a>
  </div>

  <p>
    Renew today to restore your full benefits.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentUpgradeSubscriptionEmailSubject = (
    name: string,
    subscriptionName: string,
) => `${name}, Upgrade Your ${subscriptionName} Subscription to Reach More Genuine Buyers/Tenants`;

export const agentUpgradeSubscriptionEmail = (
    name: string,
    subscriptionName: string,
    link: string = "https://propenu.com/plans/pricing/agent-plan",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Upgrade Your Subscription</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Take your property listings further by upgrading your <b>${subscriptionName}</b> subscription.
  </p>

  <p>
    With premium access, you can boost visibility, generate more quality enquiries, and manage your properties more effectively — all in one place.
  </p>

  <p>
    If you're serious about closing deals faster, it’s time to unlock more.
  </p>

  <p>
    (Display all subscription plans here)
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Take subscription/Upgrade Your Plan Now
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentListingDeactivatedEmailSubject = (
    name: string,
    propertyName: string,
) => `${name}, Your ${propertyName} Has Been Deactivated`;

export const agentListingDeactivatedEmail = (
    name: string,
    propertyName: string,
    link: string = "https://propenu.com/agent/my-properties",
    helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Listing Deactivated</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> on Propenu has been deactivated.
  </p>

  <p>
    The listing is no longer visible to buyers/tenants on the platform.
  </p>

  <p>
    If you’d like to make your property visible again and continue receiving enquiries, you can easily reactivate it from your account.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Reactivate Your Property Now
    </a>
  </div>

  <p>
    If you have any questions, feel free to reach out to our support team at <b>${helplineNumber}</b>.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const agentReactivateListingEmailSubject = (
    name: string,
    propertyName: string,
) => `${name}, Reactivate Your ${propertyName} to Resume Enquiries`;

export const agentReactivateListingEmail = (
    name: string,
    propertyName: string,
    activeUsers: string,
    link: string = "https://propenu.com/agent/my-properties",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Reactivate Your Listing</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> is currently not visible to  active buyers/tenants on Propenu.
  </p>

  <p>
    If the property is still available, reactivate your listing to bring it back online and start receiving genuine enquiries again.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Reactivate Listing to Resume Enquiries
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;
