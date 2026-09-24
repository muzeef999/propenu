import cron from "node-cron";
import mongoose from "mongoose";
import User from "../models/userModel";
import { sendEmail } from "../../../../shared/email/email.service";
import {
  sendLowEnquiriesEmail,
  sendSubscriptionEndedEmail,
  sendSubscriptionExpiryEmail,
  sendSubscriptionPromoEmail,
  sendReactivateListingEmail,
  sendLeadsDigestEmail,
  sendListingSubmittedEmail,
} from "../../../../shared/email/email.helper";
import {
  ownerIncompleteListingEmail,
  ownerIncompleteListingEmailSubject,
} from "../../../../shared/email/templates/ownerTemplates/email.templates";
import { buildUnsubscribeUrl } from "../utils/unsubscribeToken";

// ─── ENV HELPERS ─────────────────────────────────────────────────────────────

const ACTIVE_USERS = process.env.EMAIL_ACTIVE_USERS_COUNT || "10,000+";
const HELPLINE = process.env.PROPENU_HELPLINE || "+91 9182334233";
const FRONTEND_URL = (
  process.env.FRONTEND_URL || "https://propenu.com"
).replace(/\/$/, "");

function schedule(envKey: string, fallback: string): string {
  const val = process.env[envKey];
  if (val && cron.validate(val)) return val;
  if (val) {
    console.warn(
      `[email.job] Invalid cron expression for ${envKey}: "${val}". Using fallback: "${fallback}"`,
    );
  }
  return fallback;
}

/** Mongoose collection helper — works even when the model is defined in another service package */
function col(name: string) {
  return mongoose.connection.collection(name);
}

/** Base query filter that excludes unsubscribed users and users without email. */
function baseUserFilter(extra: Record<string, any> = {}): Record<string, any> {
  return {
    email: { $exists: true, $nin: [null, ""] },
    isUnsubscribedToEmail: { $ne: true },
    ...extra,
  };
}

// ─── JOB 1: INCOMPLETE LISTING REMINDER ─────────────────────────────────────
/**
 * Runs daily. Finds users whose listings are in a draft/incomplete state and
 * sends a reminder to complete and submit them.
 *
 * Schedule env: EMAIL_CRON_INCOMPLETE_LISTING  (default: daily 10 AM)
 */
async function runIncompleteListingReminder() {
  console.log("[email.job] Running: Incomplete Listing Reminder");
  try {
    // Find listing docs that are in draft/incomplete state and have a linked owner
    const drafts = await col("listings")
      .aggregate([
        {
          $match: {
            status: { $in: ["draft", "incomplete"] },
            // Only send if we haven't reminded them in the last 3 days
            $or: [
              { incompleteReminderSentAt: { $exists: false } },
              {
                incompleteReminderSentAt: {
                  $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $group: {
            _id: "$owner._id",
            name: { $first: "$owner.name" },
            email: { $first: "$owner.email" },
            listingId: { $first: "$_id" },
          },
        },
      ])
      .toArray();

    let sent = 0;
    for (const row of drafts) {
      const { name, email, listingId } = row;
      const link = `${FRONTEND_URL}/postproperty`;
      const unsubscribeUrl = buildUnsubscribeUrl(email);
      const html = ownerIncompleteListingEmail(
        name,
        ACTIVE_USERS,
        link,
        HELPLINE,
        unsubscribeUrl,
      );
      try {
        await sendEmail(email, ownerIncompleteListingEmailSubject(name), html);
        // Mark the listing so we don't spam again
        await col("listings").updateOne(
          { _id: listingId },
          { $set: { incompleteReminderSentAt: new Date() } },
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send incomplete reminder to ${email}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Incomplete Listing Reminder: sent ${sent}/${drafts.length}`,
    );
  } catch (err) {
    console.error("[email.job] Incomplete Listing Reminder error:", err);
  }
}

// ─── JOB 2: LOW ENQUIRIES / BOOST ───────────────────────────────────────────
/**
 * Runs weekly (Monday). Finds approved live listings with fewer than 3 enquiries
 * in the past 7 days and sends a boost nudge.
 *
 * Schedule env: EMAIL_CRON_LOW_ENQUIRIES  (default: Monday 11 AM)
 */
async function runLowEnquiriesJob() {
  console.log("[email.job] Running: Low Enquiries / Boost");
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const LOW_THRESHOLD = 3;

    const listings = await col("listings")
      .aggregate([
        {
          $match: {
            status: "approved",
            isActive: { $ne: false },
          },
        },
        {
          $lookup: {
            from: "enquiries",
            let: { lid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$listingId", "$$lid"] } } },
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
            ],
            as: "recentEnquiries",
          },
        },
        {
          $match: {
            $expr: { $lt: [{ $size: "$recentEnquiries" }, LOW_THRESHOLD] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            city: 1,
            locality: 1,
            ownerName: "$owner.name",
            ownerEmail: "$owner.email",
          },
        },
      ])
      .toArray();

    let sent = 0;
    for (const listing of listings) {
      const { ownerName, ownerEmail, title, city, locality } = listing;
      const location =
        [locality, city].filter(Boolean).join(", ") || "your area";
      const link = `${FRONTEND_URL}/plans/pricing/owner-rent`;
      try {
        await sendLowEnquiriesEmail(
          ownerEmail,
          ownerName,
          title || "Your Property",
          location,
          link,
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send low enquiries email to ${ownerEmail}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Low Enquiries Job: sent ${sent}/${listings.length}`,
    );
  } catch (err) {
    console.error("[email.job] Low Enquiries Job error:", err);
  }
}

// ─── JOB 3: TAKE / UPGRADE SUBSCRIPTION PROMO ───────────────────────────────
/**
 * Runs weekly (Wednesday). Targets active owners who have NO active subscription.
 *
 * Schedule env: EMAIL_CRON_SUBSCRIPTION_PROMO  (default: Wednesday 9 AM)
 */
async function runSubscriptionPromoJob() {
  console.log("[email.job] Running: Subscription Promo");
  try {
    // Find users with active listings but no active subscription
    const owners = await col("listings")
      .aggregate([
        { $match: { status: "approved", isActive: { $ne: false } } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        // Check for active subscription
        {
          $lookup: {
            from: "subscriptions",
            let: { uid: "$owner._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$userId", "$$uid"] },
                  status: "active",
                  endDate: { $gte: new Date() },
                },
              },
            ],
            as: "activeSub",
          },
        },
        // Only include users with NO active subscription
        { $match: { "activeSub.0": { $exists: false } } },
        {
          $group: {
            _id: "$owner._id",
            ownerName: { $first: "$owner.name" },
            ownerEmail: { $first: "$owner.email" },
            title: { $first: "$title" },
            city: { $first: "$city" },
            locality: { $first: "$locality" },
          },
        },
      ])
      .toArray();

    let sent = 0;
    for (const row of owners) {
      const { ownerName, ownerEmail, title, city, locality } = row;
      const location =
        [locality, city].filter(Boolean).join(", ") || "your area";
      const link = `${FRONTEND_URL}/plans/pricing/owner-rent`;
      try {
        await sendSubscriptionPromoEmail(
          ownerEmail,
          ownerName,
          title || "Your Property",
          location,
          "Premium",
          link,
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send subscription promo to ${ownerEmail}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Subscription Promo Job: sent ${sent}/${owners.length}`,
    );
  } catch (err) {
    console.error("[email.job] Subscription Promo Job error:", err);
  }
}

// ─── JOB 4: SUBSCRIPTION EXPIRY REMINDER ────────────────────────────────────
/**
 * Runs daily. Finds subscriptions expiring within the next 3 days and
 * sends a renewal reminder.
 *
 * Schedule env: EMAIL_CRON_SUBSCRIPTION_EXPIRY  (default: daily 9 AM)
 */
async function runSubscriptionExpiryJob() {
  console.log("[email.job] Running: Subscription Expiry Reminder");
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const subscriptions = await col("subscriptions")
      .aggregate([
        {
          $match: {
            status: "active",
            endDate: { $gte: now, $lte: threeDaysFromNow },
            expiryReminderSentAt: { $exists: false },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $lookup: {
            from: "listings",
            localField: "listingId",
            foreignField: "_id",
            as: "listing",
          },
        },
        { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    let sent = 0;
    for (const sub of subscriptions) {
      const { owner, listing, planName, name: subName } = sub;
      const subscriptionName = planName || subName || "Subscription";
      const propertyName = listing?.title || "Your Property";
      const location =
        [listing?.locality, listing?.city].filter(Boolean).join(", ") ||
        "your area";
      const link = `${FRONTEND_URL}/plans/pricing/owner-rent`;

      try {
        await sendSubscriptionExpiryEmail(
          owner.email,
          owner.name,
          subscriptionName,
          propertyName,
          location,
          link,
        );
        await col("subscriptions").updateOne(
          { _id: sub._id },
          { $set: { expiryReminderSentAt: new Date() } },
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send expiry reminder to ${owner.email}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Subscription Expiry Job: sent ${sent}/${subscriptions.length}`,
    );
  } catch (err) {
    console.error("[email.job] Subscription Expiry Job error:", err);
  }
}

// ─── JOB 5: SUBSCRIPTION ENDED / RENEWAL ────────────────────────────────────
/**
 * Runs daily. Finds subscriptions that ended in the last 24 hours.
 *
 * Schedule env: EMAIL_CRON_SUBSCRIPTION_ENDED  (default: daily 10 AM)
 */
async function runSubscriptionEndedJob() {
  console.log("[email.job] Running: Subscription Ended");
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const subscriptions = await col("subscriptions")
      .aggregate([
        {
          $match: {
            status: { $in: ["expired", "cancelled"] },
            endDate: { $gte: oneDayAgo, $lte: new Date() },
            endedEmailSentAt: { $exists: false },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $lookup: {
            from: "listings",
            localField: "listingId",
            foreignField: "_id",
            as: "listing",
          },
        },
        { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    let sent = 0;
    for (const sub of subscriptions) {
      const { owner, listing, planName, name: subName } = sub;
      const subscriptionName = planName || subName || "Subscription";
      const propertyName = listing?.title || "Your Property";
      const location =
        [listing?.locality, listing?.city].filter(Boolean).join(", ") ||
        "your area";
      const link = `${FRONTEND_URL}/plans/pricing/owner-rent`;

      try {
        await sendSubscriptionEndedEmail(
          owner.email,
          owner.name,
          subscriptionName,
          propertyName,
          location,
          link,
        );
        await col("subscriptions").updateOne(
          { _id: sub._id },
          { $set: { endedEmailSentAt: new Date() } },
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send subscription ended email to ${owner.email}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Subscription Ended Job: sent ${sent}/${subscriptions.length}`,
    );
  } catch (err) {
    console.error("[email.job] Subscription Ended Job error:", err);
  }
}

// ─── JOB 6: LEADS DIGEST (every 2 days) ─────────────────────────────────────
/**
 * Runs every 2 days. Finds approved listings with unread/new enquiries and
 * sends the owner a digest of how many leads are waiting.
 *
 * Schedule env: EMAIL_CRON_LEADS_DIGEST  (default: every 2 days at 8 AM)
 */
async function runLeadsDigestJob() {
  console.log("[email.job] Running: Leads Digest");
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const results = await col("listings")
      .aggregate([
        { $match: { status: "approved", isActive: { $ne: false } } },
        {
          $lookup: {
            from: "enquiries",
            let: { lid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$listingId", "$$lid"] } } },
              { $match: { createdAt: { $gte: twoDaysAgo } } },
            ],
            as: "newEnquiries",
          },
        },
        // Only listings with at least 1 new enquiry
        { $match: { $expr: { $gt: [{ $size: "$newEnquiries" }, 0] } } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            city: 1,
            locality: 1,
            ownerName: "$owner.name",
            ownerEmail: "$owner.email",
            leadCount: { $size: "$newEnquiries" },
          },
        },
      ])
      .toArray();

    let sent = 0;
    for (const row of results) {
      const { ownerName, ownerEmail, title, city, locality, leadCount } = row;
      const location =
        [locality, city].filter(Boolean).join(", ") || "your area";
      const link = `${FRONTEND_URL}/my-properties`;
      try {
        await sendLeadsDigestEmail(
          ownerEmail,
          ownerName,
          title || "Your Property",
          location,
          leadCount,
          link,
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send leads digest to ${ownerEmail}:`,
          err,
        );
      }
    }
    console.log(`[email.job] Leads Digest Job: sent ${sent}/${results.length}`);
  } catch (err) {
    console.error("[email.job] Leads Digest Job error:", err);
  }
}

// ─── JOB 7: REACTIVATE LISTING ───────────────────────────────────────────────
/**
 * Runs weekly (Tuesday). Targets deactivated listings older than 7 days and
 * encourages owners to reactivate.
 *
 * Schedule env: EMAIL_CRON_REACTIVATE_LISTING  (default: Tuesday 11 AM)
 */
async function runReactivateListingJob() {
  console.log("[email.job] Running: Reactivate Listing");
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const listings = await col("listings")
      .aggregate([
        {
          $match: {
            isActive: false,
            updatedAt: { $lt: sevenDaysAgo },
            $or: [
              { reactivateEmailSentAt: { $exists: false } },
              {
                reactivateEmailSentAt: {
                  $lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: "$owner" },
        {
          $match: {
            "owner.email": { $exists: true, $nin: [null, ""] },
            "owner.isUnsubscribedToEmail": { $ne: true },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            city: 1,
            locality: 1,
            ownerName: "$owner.name",
            ownerEmail: "$owner.email",
          },
        },
      ])
      .toArray();

    let sent = 0;
    for (const listing of listings) {
      const { ownerName, ownerEmail, title, city, locality } = listing;
      const location =
        [locality, city].filter(Boolean).join(", ") || "your area";
      const link = `${FRONTEND_URL}/my-properties`;
      try {
        await sendReactivateListingEmail(
          ownerEmail,
          ownerName,
          title || "Your Property",
          location,
          link,
        );
        await col("listings").updateOne(
          { _id: listing._id },
          { $set: { reactivateEmailSentAt: new Date() } },
        );
        sent++;
      } catch (err) {
        console.error(
          `[email.job] Failed to send reactivate listing email to ${ownerEmail}:`,
          err,
        );
      }
    }
    console.log(
      `[email.job] Reactivate Listing Job: sent ${sent}/${listings.length}`,
    );
  } catch (err) {
    console.error("[email.job] Reactivate Listing Job error:", err);
  }
}

// ─── START ───────────────────────────────────────────────────────────────────

export function startEmailJob() {
  const schedules = {
    incompleteListing: schedule("EMAIL_CRON_INCOMPLETE_LISTING", "0 10 * * *"),
    lowEnquiries: schedule("EMAIL_CRON_LOW_ENQUIRIES", "0 11 * * 1"),
    subscriptionPromo: schedule("EMAIL_CRON_SUBSCRIPTION_PROMO", "0 9 * * 3"),
    subscriptionExpiry: schedule("EMAIL_CRON_SUBSCRIPTION_EXPIRY", "0 9 * * *"),
    subscriptionEnded: schedule("EMAIL_CRON_SUBSCRIPTION_ENDED", "0 10 * * *"),
    leadsDigest: schedule("EMAIL_CRON_LEADS_DIGEST", "0 8 */2 * *"),
    reactivateListing: schedule("EMAIL_CRON_REACTIVATE_LISTING", "0 11 * * 2"),
  };
  const timezone = "Asia/Kolkata";
  cron.schedule(schedules.incompleteListing, runIncompleteListingReminder, {
    timezone: timezone,
  });
  cron.schedule(schedules.lowEnquiries, runLowEnquiriesJob, {
    timezone: timezone,
  });
  cron.schedule(schedules.subscriptionPromo, runSubscriptionPromoJob, {
    timezone: timezone,
  });
  cron.schedule(schedules.subscriptionExpiry, runSubscriptionExpiryJob, {
    timezone: timezone,
  });
  cron.schedule(schedules.subscriptionEnded, runSubscriptionEndedJob, {
    timezone: timezone,
  });
  cron.schedule(schedules.leadsDigest, runLeadsDigestJob, {
    timezone: timezone,
  });
  cron.schedule(schedules.reactivateListing, runReactivateListingJob, {
    timezone: timezone,
  });

  console.log("✅ Email cron jobs registered:");
  for (const [name, expr] of Object.entries(schedules)) {
    console.log(`   • ${name}: ${expr}`);
  }
}
