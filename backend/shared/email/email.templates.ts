
export const welcomeTemplate = (name: string, link: string) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px">

  <h2 style="color:#2c7be5;">Welcome to Propenu 🎉</h2>

  <p>Hello <b>${name}</b>,</p>

  <p>
  Welcome to <b>Propenu</b> — your verification is now complete.
  </p>

  <p>
  You’re officially part of a platform built on trust with:
  </p>

  <ul>
    <li>✔ Verified users</li>
    <li>✔ Verified properties</li>
    <li>✔ Zero spam</li>
    <li>✔ Secure transactions</li>
  </ul>

  <p>
  You can now post your property and move ahead with confidence on Propenu.
  </p>

  <div style="margin:20px 0;">
    <a href="${link}"
       style="background:#2c7be5;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
       Start Posting Your Property
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




export const listingSubmittedTemplate = (
  name: string,
  property: string,
  location: string,
  link: string
) => `
<div style="font-family: Arial, sans-serif; max-width:600px; margin:auto">

  <h2 style="color:#2c7be5;">✅ Listing Submitted Successfully</h2>

  <p>Hi <b>${name}</b>,</p>

  <p>
    Your <b>${property}</b> in <b>${location}</b> has been submitted on Propenu
    and is currently under verification.
  </p>

  <p>
    Verification usually completes within <b>24 hours</b>. Once approved,
    your property will go live.
  </p>

  <a href="${link}"
     style="display:inline-block;padding:12px 20px;
     background:#2c7be5;color:white;border-radius:6px;
     text-decoration:none;margin-top:10px">

     Track your listing status
  </a>

  <p style="margin-top:20px">
    For any assistance contact us at <b>+91 82334233</b>
  </p>

  <p style="color:#888">— Team Propenu</p>

</div>`;