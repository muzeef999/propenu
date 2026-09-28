import {
  emailLayout,
  ctaButton,
  infoBox,
  p,
  h1,
  regards,
} from "../ownerTemplates/email.templates";

export const buyerWelcomeEmailSubject = (name: string) =>
  `${name}, Welcome to Propenu — You’re Verified`;

export const buyerWelcomeEmail = (
  name: string,
  linkOrEmail: string = "https://propenu.com/properties",
  maybeLink?: string,
  maybeUnsubscribeUrl?: string,
) => {
  let link = "https://propenu.com/properties";
  let unsubscribeUrl = "https://propenu.com/unsubscribe";

  if (maybeUnsubscribeUrl) {
    link = maybeLink || link;
    unsubscribeUrl = maybeUnsubscribeUrl;
  } else if (maybeLink) {
    if (linkOrEmail.includes("@")) {
      link = maybeLink;
    } else {
      link = linkOrEmail;
      unsubscribeUrl = maybeLink;
    }
  } else if (linkOrEmail) {
    if (!linkOrEmail.includes("@")) {
      link = linkOrEmail;
    }
  }

  return emailLayout(
    `
    ${h1("Welcome to Propenu")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("Welcome to <strong>Propenu</strong> — your verification is now complete.")}
    ${p("You're officially part of a platform built on trust — with verified users, verified properties, zero spam, and secure transactions.")}
    ${p("You can now search verified properties and move ahead with confidence on Propenu.")}
    ${ctaButton("Explore Properties", link)}
    ${p("We're excited to have you with us and wish you great success on the platform.")}
    ${regards()}
  `,
    unsubscribeUrl,
  );
};

export const buyerContactLimitReachedEmailSubject = (name: string) =>
  `${name}, Contact Limit Reached — Take Subscription to Continue`;

export const buyerContactLimitReachedEmail = (
  name: string,
  email: string,
  link: string = "https://propenu.com/plans/pricing/buy-view",
  unsubscribeUrl: string = "https://propenu.com/unsubscribe",
) =>
  emailLayout(
    `
    ${h1("Contact Limit Reached")}
    ${p(`Hello <strong>${name}</strong>,`)}
    ${p("You've reached your current limit for contacting owners on Propenu.")}
    ${p("Take a subscription to continue connecting with property owners and explore more opportunities without interruption.")}
    ${p("Don't miss out on the right property.")}
    ${ctaButton("Take Subscription to Continue", link)}
    ${regards()}
  `,
    unsubscribeUrl,
  );

export const buyerPaymentSuccessEmailSubject = (
  name: string,
  subscriptionName: string,
) => `${name}, Payment Successful — ${subscriptionName} Subscription Activated`;

export const buyerPaymentSuccessEmail = (
  name: string,
  subscriptionName: string,
  email: string,
  link: string = "https://propenu.com/account-settings",
) => `
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    background-color:#f4f7f5;
    margin:0;
    padding:40px 16px;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <tr>
    <td align="center">

      <!-- Main Container -->
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          max-width:560px;
          width:100%;
          background-color:#ffffff;
          border-radius:18px;
          overflow:hidden;
        "
      >

        <!-- Header -->
        <tr>
          <td style="padding:30px;background-color:#ffffff;">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
            >
              <tr>

                <!-- Logo -->
                <td
                  align="left"
                  valign="middle"
                  style="vertical-align:middle;"
                >
                  <img
                    src="https://propenu.com/email/propenu-logo.png"
                    width="151"
                    alt="Propenu"
                    style="
                      display:block;
                      width:151px;
                      max-width:151px;
                      height:auto;
                      border:0;
                      outline:none;
                      text-decoration:none;
                    "
                  />
                </td>

                <!-- App Download Area -->
                <td
                  align="right"
                  valign="middle"
                  style="vertical-align:middle;"
                >
                  <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    align="right"
                  >
                    <tr>

                      <!-- Text -->
                      <td
                        valign="middle"
                        style="
                          vertical-align:middle;
                          padding-right:10px;
                          font-size:11px;
                          line-height:16px;
                          color:#9ca3af;
                          white-space:nowrap;
                        "
                      >
                        Get the app from
                      </td>

                      <!-- App Store -->
                      <td
                        width="24"
                        valign="middle"
                        align="center"
                        style="
                          width:24px;
                          vertical-align:middle;
                          text-align:center;
                        "
                      >
                        <a
                          href="[APP_STORE_LINK]"
                          target="_blank"
                          style="display:block;text-decoration:none;"
                        >
                          <img
                            src="https://propenu.com/email/apple.png"
                            width="24"
                            alt="App Store"
                            style="
                              display:block;
                              width:24px;
                              max-width:24px;
                              height:auto;
                              border:0;
                              outline:none;
                              text-decoration:none;
                            "
                          />
                        </a>
                      </td>

                      <!-- Gap -->
                      <td
                        width="10"
                        style="
                          width:10px;
                          font-size:0;
                          line-height:0;
                        "
                      >
                        &nbsp;
                      </td>

                      <!-- Google Play -->
                      <td
                        width="24"
                        valign="middle"
                        align="center"
                        style="
                          width:24px;
                          vertical-align:middle;
                          text-align:center;
                        "
                      >
                        <a
                          href="[PLAY_STORE_LINK]"
                          target="_blank"
                          style="display:block;text-decoration:none;"
                        >
                          <img
                            src="https://propenu.com/email/playstore.png"
                            width="24"
                            alt="Google Play"
                            style="
                              display:block;
                              width:24px;
                              max-width:24px;
                              height:auto;
                              border:0;
                              outline:none;
                              text-decoration:none;
                            "
                          />
                        </a>
                      </td>

                    </tr>
                  </table>
                </td>

              </tr>
            </table>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td
            style="
              height:1px;
              background-color:#eee;
              font-size:0;
              line-height:0;
            "
          >
            &nbsp;
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:42px 42px 20px 42px;">

            <h1
              style="
                margin:0 0 22px 0;
                font-size:28px;
                line-height:36px;
                font-weight:700;
                color:#111827;
              "
            >
              Payment Successful
            </h1>

            <p
              style="
                margin:0 0 18px 0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              Hello <strong>${name}</strong>,
            </p>

            <p
              style="
                margin:0 0 18px 0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              Your payment has been successfully processed, and your
              <strong>${subscriptionName}</strong> subscription is now active
              on Propenu.
            </p>

            <p
              style="
                margin:0 0 18px 0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              You can now enjoy uninterrupted access to your plan features.
            </p>

            <p
              style="
                margin:0 0 30px 0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              You can download your invoice below.
            </p>

            <!-- Payment Status -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background-color:#f0fdf4;
                border-radius:12px;
                margin-bottom:30px;
              "
            >
              <tr>
                <td style="padding:18px 20px;">

                  <p
                    style="
                      margin:0;
                      font-size:15px;
                      line-height:24px;
                      color:#166534;
                    "
                  >
                    <strong>Your subscription is now active.</strong><br />
                    You can continue using your plan features without interruption.
                  </p>

                </td>
              </tr>
            </table>

            <!-- Invoice CTA -->
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="margin:0 0 30px 0;"
            >
              <tr>
                <td align="center">

                  <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                  >
                    <tr>
                      <td
                        align="center"
                        bgcolor="#16a34a"
                        style="border-radius:10px;"
                      >
                        <a
                          href="${link}"
                          target="_blank"
                          style="
                            display:inline-block;
                            padding:15px 34px;
                            font-size:16px;
                            line-height:20px;
                            font-weight:700;
                            color:#ffffff;
                            text-decoration:none;
                            background-color:#16a34a;
                            border-radius:10px;
                          "
                        >
                          Download Your Invoice
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <p
              style="
                margin:0 0 8px 0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              Thank you for choosing Propenu.
            </p>

            <p
              style="
                margin:0;
                font-size:16px;
                line-height:26px;
                color:#374151;
              "
            >
              Regards,<br />
              <strong>Team Propenu</strong>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td
            align="center"
            style="
              padding:28px 30px;
              background-color:#f9fafb;
              border-top:1px solid #e5e7eb;
            "
          >

            <p
              style="
                margin:0;
                font-size:12px;
                line-height:20px;
                color:#9ca3af;
              "
            >
              This email was sent regarding your Propenu account.
            </p>

            <p
              style="
                margin:8px 0 0 0;
                font-size:12px;
                line-height:20px;
              "
            >
              <a
                href="/unsubscribe"
                target="_blank"
                style="
                  color:#9ca3af;
                  text-decoration:underline;
                "
              >
                Unsubscribe
              </a>
            </p>

            <p
              style="
                margin:6px 0 0 0;
                font-size:12px;
                line-height:20px;
                color:#9ca3af;
              "
            >
              © Propenu. All rights reserved.
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`;
