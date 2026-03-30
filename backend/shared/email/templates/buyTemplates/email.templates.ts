export const buyerWelcomeEmailSubject = (name: string) =>
    `${name}, Welcome to Propenu — You’re Verified`;

export const buyerWelcomeEmail = (
    name: string,
    link: string = "https://propenu.com",
) => `
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
    You can now explore properties and move ahead with confidence on Propenu.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Begin your property search here
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

export const buyerContactLimitReachedEmailSubject = (
    name: string,
) => `${name}, Contact Limit Reached — Take Subscription to Continue`;

export const buyerContactLimitReachedEmail = (
    name: string,
    link: string = "https://propenu.com/plans/pricing/buy-view",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Contact Limit Reached</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
    You’ve reached your current limit for contacting owners on Propenu.
  </p>

  <p>
    Take a subscription to continue connecting with property owners and explore more opportunities without interruption.
  </p>

  <p>
    Don’t miss out on the right property.
  </p>

  <p>
    (Display all subscription plans here)
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="display:inline-block;background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       👉 Take Subscription to continue contacting owners and unlock more opportunities
    </a>
  </div>

  <p style="margin-top:30px;">
    Regards,<br/>
    <b>Team Propenu</b>
  </p>

</div>`;

export const buyerPaymentSuccessEmailSubject = (name: string, subscriptionName: string) =>
    `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;

export const buyerPaymentSuccessEmail = (
    name: string,
    subscriptionName: string,
    link: string = "https://propenu.com/account-settings",
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Payment Successful 🎉</h2>

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
    <a href="${link}"
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
