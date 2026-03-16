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

</div>
`;