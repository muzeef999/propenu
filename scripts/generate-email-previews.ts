import fs from "fs";
import path from "path";
import {
  ownerWelcomeEmail,
  ownerWelcomeEmailSubject,
  ownerListingSubmittedEmail,
  ownerListingSubmittedEmailSubject,
  ownerListingLiveEmail,
  ownerListingLiveEmailSubject,
  ownerListingRejectedEmail,
  ownerListingRejectedEmailSubject,
  ownerLowEnquiriesEmail,
  ownerLowEnquiriesEmailSubject,
  ownerDailyLeadsDigestEmail,
  ownerDailyLeadsDigestEmailSubject,
  ownerBoostActivatedEmail,
  ownerBoostActivatedEmailSubject,
  ownerPaymentFailedEmail,
  ownerPaymentFailedEmailSubject,
  ownerShortlistedPropertyEmail,
  ownerShortlistedPropertyEmailSubject,
  ownerUserContactingEmail,
  ownerUserContactingEmailSubject,
  ownerCallbackRequestEmail,
  ownerCallbackRequestEmailSubject,
  ownerListingDeactivatedEmail,
  ownerListingDeactivatedEmailSubject,
} from "../backend/shared/email/templates/ownerTemplates/email.templates";

import {
  agentListingSubmittedEmail,
  agentListingSubmittedEmailSubject,
  agentListingLiveEmail,
  agentListingLiveEmailSubject,
  agentListingRejectedEmail,
  agentListingRejectedEmailSubject,
  agentListingDeactivatedEmail,
  agentListingDeactivatedEmailSubject,
} from "../backend/shared/email/templates/agentTemplates/email.templates";

import {
  buyerWelcomeEmail,
  buyerWelcomeEmailSubject,
} from "../backend/shared/email/templates/buyTemplates/email.templates";

import { REJECTION_REASONS } from "../backend/shared/constants/rejectionReasons";

const outputDir = path.join(process.cwd(), "email-previews");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sample = {
  name: "Vikram Malhotra",
  propertyName: "3 BHK Premium Apartment",
  location: "Koramangala, Bangalore",
  reason: REJECTION_REASONS[0],
  link: "http://localhost:3000/my-properties",
  agentLink: "http://localhost:3000/agent/my-properties",
  helpline: process.env.PROPENU_HELPLINE || "+91 9182334233",
  email: "vikram@example.com",
  buyerName: "Sneha Patel",
  unsubscribeUrl: "http://localhost:4000/api/users/unsubscribe-email?email=vikram%40example.com",
  planName: "Prime 30-Day Boost",
};

interface EmailItem {
  id: string;
  category: "Owner" | "Agent" | "Buyer";
  title: string;
  filename: string;
  subject: string;
  html: string;
}

const emailList: EmailItem[] = [
  // ─── OWNER EMAILS ───
  {
    id: "owner-welcome",
    category: "Owner",
    title: "02. Welcome to Propenu",
    filename: "owner-02-welcome.html",
    subject: ownerWelcomeEmailSubject(sample.name),
    html: ownerWelcomeEmail(sample.name, "http://localhost:3000/postproperty", sample.unsubscribeUrl),
  },
  {
    id: "owner-submitted",
    category: "Owner",
    title: "03. Listing Submitted Successfully",
    filename: "owner-03-submitted.html",
    subject: ownerListingSubmittedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerListingSubmittedEmail(sample.name, sample.propertyName, sample.location, sample.link, sample.helpline, sample.unsubscribeUrl),
  },
  {
    id: "owner-live",
    category: "Owner",
    title: "04. Listing Approved & Live",
    filename: "owner-04-approved-live.html",
    subject: ownerListingLiveEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerListingLiveEmail(sample.name, sample.propertyName, sample.location, "10,000+", sample.link, sample.unsubscribeUrl),
  },
  {
    id: "owner-rejected",
    category: "Owner",
    title: "05. Listing Verification Failed",
    filename: "owner-05-rejected.html",
    subject: ownerListingRejectedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerListingRejectedEmail(sample.name, sample.propertyName, sample.location, sample.reason, sample.link, sample.helpline, sample.unsubscribeUrl),
  },
  {
    id: "owner-low-enquiries",
    category: "Owner",
    title: "06. Low Enquiries / Boost Suggestion",
    filename: "owner-06-low-enquiries.html",
    subject: ownerLowEnquiriesEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerLowEnquiriesEmail(sample.name, sample.propertyName, sample.location, sample.email, "http://localhost:3000/plans", sample.unsubscribeUrl),
  },
  {
    id: "owner-leads-digest",
    category: "Owner",
    title: "07. Daily Leads Digest",
    filename: "owner-07-leads-digest.html",
    subject: ownerDailyLeadsDigestEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerDailyLeadsDigestEmail(sample.name, sample.propertyName, sample.location, 4, sample.link, sample.unsubscribeUrl),
  },
  {
    id: "owner-boost",
    category: "Owner",
    title: "08. Boost Activated",
    filename: "owner-08-boost-activated.html",
    subject: ownerBoostActivatedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerBoostActivatedEmail(sample.name, sample.propertyName, sample.location, sample.planName, sample.email, "http://localhost:3000/settings", sample.unsubscribeUrl),
  },
  {
    id: "owner-payment-failed",
    category: "Owner",
    title: "09. Payment Failed",
    filename: "owner-09-payment-failed.html",
    subject: ownerPaymentFailedEmailSubject(sample.name, sample.planName),
    html: ownerPaymentFailedEmail(sample.name, "http://localhost:3000/plans", sample.email, sample.helpline, sample.unsubscribeUrl),
  },
  {
    id: "owner-shortlisted",
    category: "Owner",
    title: "10. Shortlisted Property",
    filename: "owner-10-shortlisted.html",
    subject: ownerShortlistedPropertyEmailSubject(sample.name, sample.buyerName, sample.propertyName, sample.location),
    html: ownerShortlistedPropertyEmail(sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link, sample.unsubscribeUrl),
  },
  {
    id: "owner-user-contacting",
    category: "Owner",
    title: "11. User Contacting Owner",
    filename: "owner-11-user-contacting.html",
    subject: ownerUserContactingEmailSubject(sample.name, sample.buyerName, sample.propertyName, sample.location),
    html: ownerUserContactingEmail(sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link, sample.unsubscribeUrl),
  },
  {
    id: "owner-callback",
    category: "Owner",
    title: "12. Callback Request",
    filename: "owner-12-callback-request.html",
    subject: ownerCallbackRequestEmailSubject(sample.name, sample.buyerName, sample.propertyName, sample.location),
    html: ownerCallbackRequestEmail(sample.name, sample.buyerName, sample.propertyName, sample.location, sample.link, sample.unsubscribeUrl),
  },
  {
    id: "owner-deactivated",
    category: "Owner",
    title: "17. Listing Deactivated",
    filename: "owner-17-deactivated.html",
    subject: ownerListingDeactivatedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: ownerListingDeactivatedEmail(sample.name, sample.propertyName, sample.location, sample.link, sample.helpline, sample.unsubscribeUrl),
  },

  // ─── AGENT EMAILS ───
  {
    id: "agent-submitted",
    category: "Agent",
    title: "Agent - Listing Submitted",
    filename: "agent-03-submitted.html",
    subject: agentListingSubmittedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: agentListingSubmittedEmail(sample.name, sample.propertyName, sample.location, sample.agentLink, sample.helpline, sample.unsubscribeUrl),
  },
  {
    id: "agent-live",
    category: "Agent",
    title: "Agent - Listing Live",
    filename: "agent-04-approved-live.html",
    subject: agentListingLiveEmailSubject(sample.name, sample.propertyName, sample.location),
    html: agentListingLiveEmail(sample.name, sample.propertyName, sample.location, "10,000+", sample.agentLink, sample.unsubscribeUrl),
  },
  {
    id: "agent-rejected",
    category: "Agent",
    title: "Agent - Listing Verification Failed",
    filename: "agent-05-rejected.html",
    subject: agentListingRejectedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: agentListingRejectedEmail(sample.name, sample.propertyName, sample.location, sample.reason, sample.agentLink, sample.helpline, sample.unsubscribeUrl),
  },
  {
    id: "agent-deactivated",
    category: "Agent",
    title: "Agent - Listing Deactivated",
    filename: "agent-17-deactivated.html",
    subject: agentListingDeactivatedEmailSubject(sample.name, sample.propertyName, sample.location),
    html: agentListingDeactivatedEmail(sample.name, sample.propertyName, sample.location, sample.agentLink, sample.helpline, sample.unsubscribeUrl),
  },

  // ─── BUYER EMAILS ───
  {
    id: "buyer-welcome",
    category: "Buyer",
    title: "Buyer - Welcome to Propenu",
    filename: "buyer-02-welcome.html",
    subject: buyerWelcomeEmailSubject(sample.name),
    html: buyerWelcomeEmail(sample.name, "http://localhost:3000/properties", sample.unsubscribeUrl),
  },
];

console.log(`Writing ${emailList.length} individual email preview files to: ${outputDir}`);

for (const item of emailList) {
  const filePath = path.join(outputDir, item.filename);
  fs.writeFileSync(filePath, item.html, "utf8");
}

// Generate the interactive dashboard index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Propenu Email Previews (Localhost)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      background-color: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-propenu {
      background: #16a34a;
      color: white;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      letter-spacing: 0.5px;
    }
    .brand h1 {
      font-size: 16px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .viewport-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-view {
      background: #334155;
      color: #cbd5e1;
      border: 1px solid #475569;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .btn-view:hover, .btn-view.active {
      background: #16a34a;
      color: white;
      border-color: #16a34a;
    }
    .layout-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }
    sidebar {
      width: 340px;
      background: #1e293b;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .filter-tabs {
      display: flex;
      padding: 12px 12px 6px;
      gap: 6px;
      border-bottom: 1px solid #334155;
    }
    .tab-btn {
      flex: 1;
      background: #0f172a;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .tab-btn.active {
      background: #16a34a;
      color: white;
      border-color: #16a34a;
    }
    .email-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .email-card {
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      background: #0f172a;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .email-card:hover {
      background: #1e293b;
      border-color: #475569;
    }
    .email-card.selected {
      background: #14532d;
      border-color: #22c55e;
    }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .card-role {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #334155;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .email-card.selected .card-role {
      background: #16a34a;
      color: white;
    }
    .card-subject {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0f172a;
      min-width: 0;
    }
    .preview-header {
      background: #1e293b;
      padding: 12px 20px;
      border-bottom: 1px solid #334155;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 600;
      min-width: 60px;
    }
    .meta-value {
      color: #e2e8f0;
      font-weight: 500;
      word-break: break-all;
    }
    .frame-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: auto;
      background: #090d16;
    }
    iframe {
      width: 600px;
      height: 100%;
      background: #ffffff;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      transition: width 0.2s ease;
    }
    .external-btn {
      font-size: 12px;
      color: #38bdf8;
      text-decoration: none;
      margin-left: auto;
    }
    .external-btn:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="badge-propenu">PROPENU</span>
      <h1>Email Notification Preview Dashboard (Localhost)</h1>
    </div>
    <div class="viewport-controls">
      <button class="btn-view active" onclick="setViewport(600, this)">Desktop (600px)</button>
      <button class="btn-view" onclick="setViewport(375, this)">Mobile (375px)</button>
      <button class="btn-view" onclick="setViewport('100%', this)">Full Width</button>
    </div>
  </header>

  <div class="layout-body">
    <sidebar>
      <div class="filter-tabs">
        <button class="tab-btn active" onclick="filterTab('all', this)">All (${emailList.length})</button>
        <button class="tab-btn" onclick="filterTab('Owner', this)">Owner</button>
        <button class="tab-btn" onclick="filterTab('Agent', this)">Agent</button>
        <button class="tab-btn" onclick="filterTab('Buyer', this)">Buyer</button>
      </div>
      <div class="email-list" id="emailList">
        ${emailList
          .map(
            (item, index) => `
          <div class="email-card ${index === 0 ? "selected" : ""}" data-category="${item.category}" onclick="selectEmail('${item.id}', '${item.filename}', '${encodeURIComponent(item.subject)}', '${item.title}', this)">
            <div class="card-top">
              <span class="card-title">${item.title}</span>
              <span class="card-role">${item.category}</span>
            </div>
            <div class="card-subject">${item.subject}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </sidebar>

    <main>
      <div class="preview-header">
        <div class="meta-row">
          <span class="meta-label">Title:</span>
          <span class="meta-value" id="currentTitle">${emailList[0].title}</span>
          <a class="external-btn" id="openExternalLink" href="${emailList[0].filename}" target="_blank">Open in New Tab &nearr;</a>
        </div>
        <div class="meta-row">
          <span class="meta-label">Subject:</span>
          <span class="meta-value" id="currentSubject">${emailList[0].subject}</span>
        </div>
      </div>
      <div class="frame-container">
        <iframe id="previewFrame" src="${emailList[0].filename}"></iframe>
      </div>
    </main>
  </div>

  <script>
    function selectEmail(id, filename, encodedSubject, title, element) {
      document.querySelectorAll('.email-card').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
      document.getElementById('previewFrame').src = filename;
      document.getElementById('currentTitle').textContent = title;
      document.getElementById('currentSubject').textContent = decodeURIComponent(encodedSubject);
      document.getElementById('openExternalLink').href = filename;
    }

    function setViewport(width, button) {
      document.querySelectorAll('.btn-view').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const frame = document.getElementById('previewFrame');
      frame.style.width = typeof width === 'number' ? width + 'px' : width;
    }

    function filterTab(category, button) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.email-card').forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml, "utf8");

console.log("\n============================================================");
console.log("   EMAIL PREVIEW FILES GENERATED SUCCESSFULLY!");
console.log("============================================================");
console.log(`Directory: ${outputDir}`);
console.log(`Index file: ${path.join(outputDir, "index.html")}`);
console.log("\nTo view the interactive preview dashboard right now, run:");
console.log("   open email-previews/index.html");
console.log("============================================================\n");
