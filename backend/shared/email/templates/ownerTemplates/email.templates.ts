export const ownerWelcomeEmailSubject = (name: string) => `${name}, Welcome to Propenu - Your Verification is Complete`;

export const ownerWelcomeEmail = (name: string, link: string = "https://propenu.com/postproperty") => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Welcome to Propenu 🎉</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>
    Welcome to <b>Propenu</b> — your verification is now complete.
  </p>
  <p>
    You’re officially part of a platform built on trust with: verified users, verified properties, zero spam, and secure transactions.
  </p>
  <p>
    You can now post your property and move ahead with confidence on Propenu.
  </p>
  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       Post Your Property
    </a>
  </div>
  <p>
    We’re excited to have you with us and wish you great success on the platform.
  </p>
  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>
</div>  
`;

export const ownerIncompleteListingEmailSubject = (name: string) => `${name}, Continue Your Property Listing`;

export const ownerIncompleteListingEmail = (name: string, activeUsers: string) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">
  <h2 style="color:#2c7be5;">Continue Your Listing</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>
    Your property draft is saved on Propenu, and you can continue right where you left off.
  </p>
  <p>
    Your listing is still incomplete. Finish the remaining details to submit your property for verification.
  </p>
  <p>
    Once approved, your property can be shown to <b>${activeUsers}</b> active, genuine buyers/tenants searching on the platform.
  </p>
  <div style="margin:20px 0;">
    <a href="https://propenu.com/postproperty"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       Continue Your Listing
    </a>
  </div>
  <p>
    If you have any questions, feel free to reach out to our support team at <b>+91 9182334233</b>.
  </p>
  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>
</div>
`;

export const listingSubmittedTemplate = (
  name: string,
  title: string,
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Listing Submitted Successfully</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>
    Your <b>${title}</b> has been successfully submitted on Propenu.
  </p>
  <p>
    Our team is currently reviewing your listing as part of the verification process.
  </p>
  <p>
    Property verification is typically completed within <b>24 hours</b>. In rare cases, the process may take slightly longer than 24 hours. Once approved, your property will go live and become visible to genuine buyers/tenants.
  </p>
  <div style="margin:20px 0;">
    <a href="https://propenu.com/postproperty"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       View Listing to Track Its Status
    </a>
  </div>
  <p>
    Thank you for listing with Propenu.
  </p>
  <p>
    If you have any questions, feel free to reach out to our support team at <b>+91 9182334233</b>.
  </p>
  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>
</div>`;    

export const ownerListingApprovalEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) => `${name}, Your ${propertyName} in ${location} is Now Live on Propenu`;

export const ownerListingApprovalEmail = (
  name: string,
  propertyName: string,
  location: string,
  activeUsers: string,
  link: string,
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">
  <h2 style="color:#2c7be5;">Listing Approved</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>
    Great news — your <b>${propertyName}</b> in <b>${location}</b> on Propenu has been successfully approved and is now live on the platform.
  </p>
  <p>
    Your verified listing is now visible to <b>${activeUsers}</b> genuine buyers/tenants actively searching in your area. You can expect quality enquiries from interested prospects.
  </p>
  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       View Your Listing and Start Receiving Enquiries
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

export const ownerListingRejectedEmailSubject = (
  name: string,
  propertyName: string,
) =>
  `${name}, Verification Failed for Your ${propertyName} - Please Update`;

export const ownerListingRejectedEmail = (
  name: string,
  propertyName: string,
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
    <b>Rejected</b>
  </p>
  <p>
    Please update the required details and resubmit your listing to proceed with verification.
  </p>
  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       Update Your Listing and Resubmit for Review
    </a>
  </div>
  <p>
    Our team will review it again once updated. Verification is usually completed within <b>24 hours</b>, though in rare cases it may take slightly longer.
  </p>
  <p>
    If you have any questions, feel free to reach out to our support team at <b>${helplineNumber}</b>.
  </p>
  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>
</div>`;

export const ownerLowEnquiriesEmailSubject = (
  name: string,
  propertyName: string,
) => `${name}, Get More Enquiries — Boost Your ${propertyName}`;

export const ownerLowEnquiriesEmail = (
  name: string,
  propertyName: string,  link: string = "https://propenu.com/plans/pricing/owner-rent",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Boost Your Property Visibility</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> on Propenu is live, but it hasn’t received many enquiries yet.
  </p>

  <p>
    Boosting your listing can improve visibility and help you reach more genuine buyers/tenants actively searching in your area.
  </p>

  <p>
    Give your property the extra push it deserves.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Boost Your Listing to Reach More Buyers/Tenants
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const ownerBoostActivatedEmailSubject = (
  name: string,
  propertyName: string,
) => `${name}, Payment Successful — Boost Activated for Your ${propertyName}`;




export const ownerBoostActivatedEmail = (
  name: string,
  propertyName: string,
  subscriptionName: string,
  invoiceLink: string,
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Payment Successful & Boost Activated</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your payment has been successfully processed, and your <b>${subscriptionName}</b> subscription on Propenu is now activated.
  </p>

  <p>
    The boost for your <b>${propertyName}</b> is now live, giving your property enhanced visibility and helping you reach more genuine buyers/tenants.
  </p>

  <p>
    You can download your invoice below.
  </p>

  <div style="margin:20px 0;">
    <a href="${invoiceLink}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Download Invoice
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

export const ownerPaymentFailedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Failed — Retry Your ${subscriptionName} Subscription`;

export const ownerPaymentFailedEmail = (
  name: string,
  link: string,
  helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Payment Failed</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    We were unable to process your payment on Propenu.
  </p>

  <p>
    <strong>payment failed</strong>
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

export const ownerShortlistedPropertyEmailSubject = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
) => `${name}, ${buyerTenantName} Has Shortlisted Your ${propertyName}`;

export const ownerShortlistedPropertyEmail = (
  name: string,
  buyerTenantName: string,
  propertyName: string,
  link: string,
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Someone Shortlisted Your Property</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    <b>${buyerTenantName}</b> has shortlisted your <b>${propertyName}</b> on Propenu.
  </p>

  <p>
    This means <b>${buyerTenantName}</b> is interested in your property and may be planning the next step soon.
  </p>

  <p>
    You can view the buyer/tenant details and connect directly to discuss further.
  </p>

  <div style="margin:20px 0;">
    // <a href="${link}"
    //    style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
    //    👉 View Buyer/Tenant Details & Connect Now
    // </a>
  </div>

  <p>
    Quick responses can help you move the conversation forward faster.
  </p>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const ownerSubscriptionActivatedEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;


export const ownerSubscriptionActivatedEmail = (
  name: string,
  subscriptionName: string,
  invoiceLink: string,
  link: string = "https://propenu.com/plans/owner-sell",
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
    Boosting your listing can improve visibility and help you reach more genuine buyers/tenants actively searching in your area.
  </p>

  <p>
    Give your property the extra push it deserves.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Boost Your Listing to Reach More Buyers/Tenants
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;



export const ownerListingDeactivatedEmailSubject = (
  name: string,
  propertyName: string,
  location: string,
) => `${name}, Your ${propertyName} in ${location} Has Been Deactivated`;



export const ownerListingDeactivatedEmail = (
  name: string,
  propertyName: string,
  location: string,
  link: string = "https://propenu.com/my-properties",
  helplineNumber: string = "+91 9182334233",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#d9534f;">Listing Deactivated</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    Your <b>${propertyName}</b> in <b>${location}</b> on Propenu has been deactivated.
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
