import crypto from "crypto";
import mongoose from "mongoose";
import FeaturedProject from "../models/featurePropertiesModel";
import ProjectBuilderInvite, {
  InviteEmailStatus,
} from "../models/projectBuilderInviteModel";
import User from "../models/userModel";
import Role from "../models/roleModel";
import { sendEmail } from "../../../../shared/email/email.service";
import {
  buildBuilderInviteEmailHtml,
  buildBuilderOtpEmailHtml,
  builderInviteEmailSubject,
} from "../utils/builderInviteEmail";

const INVITE_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours
const OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

type StaffUser = {
  id?: string;
  sub?: string;
  name?: string;
  email?: string;
  roleName?: string;
};

type ProjectContactInput = {
  name: string;
  phone: string;
  email?: string;
  role?: string;
  isPrimary?: boolean;
};

const publicWebBase = () =>
  (
    process.env.PUBLIC_WEB_URL ||
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.propenu.com"
      : "http://localhost:3000")
  ).replace(/\/$/, "");

/** Gateway / API base for tracking pixel only — never the Next.js web app. */
const apiPublicBase = () =>
  (
    process.env.PROPERTY_PUBLIC_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.GATEWAY_PUBLIC_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function genToken() {
  return crypto.randomBytes(32).toString("hex");
}

function genTrackingId() {
  return crypto.randomBytes(16).toString("hex");
}

function genOtp() {
  // 4-digit OTP (matches user-service / invite UI)
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function normalizeEmail(email?: string) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone?: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (String(phone || "").startsWith("+")) return String(phone).trim();
  return `+${digits}`;
}

function phoneLookupValues(phone?: string) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  const values = new Set<string>();
  if (raw) values.add(raw);
  if (digits) {
    values.add(digits);
    values.add(`+${digits}`);
    if (digits.length === 10) {
      values.add(`+91${digits}`);
      values.add(`91${digits}`);
    }
    if (digits.length === 12 && digits.startsWith("91")) {
      values.add(digits.slice(2));
      values.add(`+${digits}`);
    }
  }
  return Array.from(values).filter(Boolean);
}

async function getBuilderRoleId() {
  const role = await Role.findOne({ name: "builder" }).select("_id").lean();
  if (!role?._id) {
    throw new Error("Builder role not found in roles collection");
  }
  return role._id;
}

function pushEmailStatus(
  invite: any,
  status: InviteEmailStatus,
  meta?: Record<string, unknown>,
) {
  invite.emailStatus = status;
  invite.statusHistory = invite.statusHistory || [];
  invite.statusHistory.push({
    status,
    at: new Date(),
    ...(meta ? { meta } : {}),
  });

  if (status === "sent" && !invite.sentAt) invite.sentAt = new Date();
  if (status === "delivered" && !invite.deliveredAt) invite.deliveredAt = new Date();
  if (status === "opened") {
    invite.openCount = (invite.openCount || 0) + 1;
    if (!invite.openedAt) invite.openedAt = new Date();
  }
  if (status === "clicked") {
    invite.clickCount = (invite.clickCount || 0) + 1;
    if (!invite.clickedAt) invite.clickedAt = new Date();
  }
}

function deriveUiEmailStatus(invite: {
  emailStatus: InviteEmailStatus;
  deliveredAt?: Date;
  openedAt?: Date;
}) {
  if (invite.emailStatus === "opened" || invite.openedAt) return "opened";
  if (invite.emailStatus === "clicked") return "clicked";
  if (invite.emailStatus === "onboarded") return "onboarded";
  if (invite.emailStatus === "interested") return "interested";
  if (invite.emailStatus === "bounced" || invite.emailStatus === "failed") {
    return invite.emailStatus;
  }
  if (invite.emailStatus === "delivered" || invite.deliveredAt) {
    return invite.openedAt ? "opened" : "not_opened";
  }
  if (invite.emailStatus === "sent") return "sent";
  return invite.emailStatus;
}

function ensureDraftProject(project: any) {
  if (!project) {
    const err: any = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }
  if (project.status !== "draft") {
    const err: any = new Error("Builder onboarding is only allowed on draft projects");
    err.statusCode = 400;
    throw err;
  }
}

function syncProjectOnboardingFromInvite(project: any, invite: any) {
  project.builderOnboarding = project.builderOnboarding || {};
  project.builderOnboarding.enabled = true;
  project.builderOnboarding.mode = invite.mode;
  project.builderOnboarding.assignStatus = mapInviteToAssignStatus(invite.emailStatus);
  project.builderOnboarding.inviteId = invite._id;
  project.builderOnboarding.inviteEmail = invite.email || "";
  project.builderOnboarding.invitePhone = invite.phone || "";
  project.builderOnboarding.emailStatus = invite.emailStatus;
  project.builderOnboarding.emailUiStatus = deriveUiEmailStatus(invite);
  project.builderOnboarding.lastEmailAt = invite.sentAt || invite.updatedAt;
  project.builderOnboarding.openedAt = invite.openedAt || null;
  project.builderOnboarding.clickedAt = invite.clickedAt || null;
}

function mapInviteToAssignStatus(emailStatus: InviteEmailStatus) {
  if (emailStatus === "onboarded") return "verified";
  if (emailStatus === "interested") return "interested";
  if (emailStatus === "clicked") return "clicked";
  if (emailStatus === "opened") return "opened";
  if (emailStatus === "rejected") return "rejected";
  if (emailStatus === "expired" || emailStatus === "revoked") return "expired";
  if (
    emailStatus === "sent" ||
    emailStatus === "delivered" ||
    emailStatus === "queued"
  ) {
    return "invited";
  }
  return "pending";
}

async function revokeActiveInvites(projectId: string) {
  await ProjectBuilderInvite.updateMany(
    { projectId, isActive: true },
    {
      $set: { isActive: false, emailStatus: "revoked" },
      $push: {
        statusHistory: { status: "revoked", at: new Date() },
      },
    },
  );
}

export const BuilderOnboardingService = {
  async lookupBuilder(query: { email?: string; phone?: string; q?: string }) {
    const builderRoleId = await getBuilderRoleId();
    const email = normalizeEmail(query.email);
    const phoneValues = phoneLookupValues(query.phone);
    const q = String(query.q || "").trim();

    const filter: any = {
      roleId: builderRoleId,
      isActive: { $ne: false },
    };

    const or: any[] = [];
    if (email) or.push({ email });
    if (phoneValues.length) or.push({ phone: { $in: phoneValues } });
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      or.push({ companyName: rx }, { name: rx }, { email: rx });
    }

    if (!or.length) {
      return { found: false, builders: [] as any[] };
    }

    filter.$or = or;

    const builders = await User.find(filter)
      .select("name email phone companyName accountStatus roleId createdAt")
      .limit(20)
      .lean();

    return {
      found: builders.length > 0,
      builders: builders.map((b: any) => ({
        id: String(b._id),
        name: b.name,
        email: b.email,
        phone: b.phone,
        companyName: b.companyName,
        accountStatus: b.accountStatus,
      })),
    };
  },

  async getOnboardingState(projectId: string) {
    const project = await FeaturedProject.findById(projectId)
      .select(
        "title slug status createdBy builderOnboarding projectContacts approvalStatus",
      )
      .populate("createdBy", "name email phone companyName")
      .lean();

    if (!project) {
      const err: any = new Error("Project not found");
      err.statusCode = 404;
      throw err;
    }

    const invites = await ProjectBuilderInvite.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const latest = invites[0];
    return {
      project: {
        id: String((project as any)._id),
        title: (project as any).title,
        slug: (project as any).slug,
        status: (project as any).status,
        createdBy: (project as any).createdBy,
        builderOnboarding: (project as any).builderOnboarding || null,
        projectContacts: (project as any).projectContacts || [],
        approvalStatus: (project as any).approvalStatus,
        previewUrl: (project as any).slug
          ? `${publicWebBase()}/project/${(project as any).slug}`
          : null,
      },
      latestInvite: latest
        ? {
            id: String(latest._id),
            mode: latest.mode,
            email: latest.email,
            phone: latest.phone,
            emailStatus: latest.emailStatus,
            emailUiStatus: deriveUiEmailStatus(latest),
            sentAt: latest.sentAt,
            deliveredAt: latest.deliveredAt,
            openedAt: latest.openedAt,
            clickedAt: latest.clickedAt,
            openCount: latest.openCount,
            clickCount: latest.clickCount,
            expiresAt: latest.expiresAt,
            isActive: latest.isActive,
            statusHistory: latest.statusHistory,
          }
        : null,
      invites: invites.map((inv: any) => ({
        id: String(inv._id),
        mode: inv.mode,
        email: inv.email,
        phone: inv.phone,
        emailStatus: inv.emailStatus,
        emailUiStatus: deriveUiEmailStatus(inv),
        sentAt: inv.sentAt,
        openedAt: inv.openedAt,
        clickedAt: inv.clickedAt,
        isActive: inv.isActive,
      })),
    };
  },

  /** Existing builder in DB → direct assign, no OTP */
  async assignExistingBuilder(
    projectId: string,
    builderId: string,
    staff?: StaffUser,
  ) {
    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      const err: any = new Error("Invalid builder id");
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);

    const builderRoleId = await getBuilderRoleId();
    const builder = await User.findOne({
      _id: builderId,
      roleId: builderRoleId,
    }).lean();

    if (!builder) {
      const err: any = new Error("Builder not found in database");
      err.statusCode = 404;
      throw err;
    }

    await revokeActiveInvites(projectId);

    project!.createdBy = new mongoose.Types.ObjectId(builderId);
    project!.builderOnboarding = {
      enabled: true,
      mode: "existing_builder",
      assignStatus: "verified",
      inviteEmail: (builder as any).email || "",
      invitePhone: (builder as any).phone || "",
      emailStatus: "onboarded",
      emailUiStatus: "onboarded",
      verifiedAt: new Date(),
      verifiedBy: staff?.id
        ? new mongoose.Types.ObjectId(staff.id)
        : undefined,
      builderSnapshot: {
        companyName: (builder as any).companyName || "",
        contactName: (builder as any).name || "",
        email: (builder as any).email || "",
        phone: (builder as any).phone || "",
      },
    } as any;

    await project!.save();

    return {
      message: "Builder assigned directly (already in database, no OTP required)",
      projectId,
      builderId,
      assignStatus: "verified",
    };
  },

  /** Send invite to one email (optionally skip revoking other invites). */
  async sendInvite(
    projectId: string,
    input: { email: string; phone?: string; companyName?: string },
    staff?: StaffUser,
    options?: { skipRevoke?: boolean },
  ) {
    const email = normalizeEmail(input.email);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      const err: any = new Error("Valid builder invite email is required");
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);

    if (!options?.skipRevoke) {
      await revokeActiveInvites(projectId);
    }

    const rawToken = genToken();
    const trackingId = genTrackingId();
    const invite = await ProjectBuilderInvite.create({
      projectId,
      mode: "invite_link",
      email,
      phone: input.phone ? normalizePhone(input.phone) : undefined,
      companyName: input.companyName || "",
      tokenHash: hashToken(rawToken),
      trackingId,
      emailStatus: "queued",
      statusHistory: [{ status: "queued", at: new Date() }],
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdByStaffId: staff?.id
        ? new mongoose.Types.ObjectId(staff.id)
        : undefined,
      isActive: true,
    });

    // Preview → project selling page; Approve → onboard form
    const previewUrl = `${publicWebBase()}/builder/invite/${trackingId}?token=${rawToken}&to=preview`;
    const onboardUrl = `${publicWebBase()}/builder/invite/${trackingId}?token=${rawToken}&to=onboard`;
    const openPixelUrl = `${apiPublicBase()}/api/properties/public/email/open/${trackingId}.gif`;
    const directPreview = `${publicWebBase()}/project/${project!.slug}?invite=${rawToken}`;

    const locationHint = [project!.locality, project!.city, project!.state]
      .filter(Boolean)
      .join(", ");

    const html = buildBuilderInviteEmailHtml({
      previewUrl,
      onboardUrl,
      openPixelUrl,
      projectTitle: project!.title,
      companyHint: input.companyName || "",
      locationHint,
      heroImageUrl: (project as any).heroImage || "",
    });

    try {
      const info = await sendEmail({
        to: email,
        subject: builderInviteEmailSubject,
        html,
      });
      pushEmailStatus(invite, "sent", {
        messageId: info?.messageId,
      });
      pushEmailStatus(invite, "delivered");
      invite.providerMessageId = info?.messageId || "";
      await invite.save();
    } catch (error: any) {
      pushEmailStatus(invite, "failed", { error: error?.message });
      invite.bounceReason = error?.message || "send_failed";
      await invite.save();
      syncProjectOnboardingFromInvite(project, invite);
      await project!.save();
      const err: any = new Error(
        `Failed to send invite email to ${email}: ${error?.message || "unknown error"}`,
      );
      err.statusCode = 502;
      throw err;
    }

    syncProjectOnboardingFromInvite(project, invite);
    if (!project!.builderOnboarding) {
      project!.builderOnboarding = {} as any;
    }
    project!.builderOnboarding!.assignStatus = "invited";
    project!.builderOnboarding!.mode = "invite_link";
    project!.builderOnboarding!.enabled = true;
    await project!.save();

    return {
      alreadyExists: false,
      inviteId: String(invite._id),
      trackingId,
      email,
      emailStatus: invite.emailStatus,
      emailUiStatus: deriveUiEmailStatus(invite),
      previewUrl: directPreview,
      inviteToken: rawToken,
      onboardPath: `/builder/onboard/${rawToken}`,
      expiresAt: invite.expiresAt,
      message: "Invite email sent. Tracking is active.",
    };
  },

  /** Send the same project invite to multiple builder emails. */
  async sendBulkInvites(
    projectId: string,
    input: { emails: string[]; companyName?: string },
    staff?: StaffUser,
  ) {
    const emails = Array.from(
      new Set(
        (input.emails || [])
          .map((e) => normalizeEmail(e))
          .filter((e) => e && /^\S+@\S+\.\S+$/.test(e)),
      ),
    );

    if (!emails.length) {
      const err: any = new Error("Add at least one valid builder email");
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);
    await revokeActiveInvites(projectId);

    const results: any[] = [];
    const failures: any[] = [];

    for (const email of emails) {
      try {
        const result = await this.sendInvite(
          projectId,
          { email, companyName: input.companyName },
          staff,
          { skipRevoke: true },
        );
        results.push(result);
      } catch (error: any) {
        failures.push({ email, error: error?.message || "send_failed" });
      }
    }

    if (!results.length) {
      const err: any = new Error(
        failures[0]?.error || "Failed to send any invite emails",
      );
      err.statusCode = 502;
      throw err;
    }

    return {
      message: `Invite sent to ${results.length} email(s)`,
      sent: results,
      failed: failures,
      previewUrl: `${publicWebBase()}/project/${project!.slug}`,
    };
  },

  /** Public: check if mobile already belongs to a builder account. */
  async checkInvitePhone(token: string, phoneRaw: string) {
    const invite = await ProjectBuilderInvite.findOne({
      tokenHash: hashToken(token),
      isActive: true,
      mode: "invite_link",
    }).lean();
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.statusCode = 404;
      throw err;
    }
    if ((invite as any).expiresAt < new Date()) {
      const err: any = new Error("Invite expired");
      err.statusCode = 410;
      throw err;
    }

    const phone = normalizePhone(phoneRaw);
    const phoneValues = phoneLookupValues(phone);
    if (!phone || phoneValues.length === 0) {
      const err: any = new Error("Valid mobile number is required");
      err.statusCode = 400;
      throw err;
    }

    const builderRoleId = await getBuilderRoleId();
    const builder = await User.findOne({
      phone: { $in: phoneValues },
      roleId: builderRoleId,
    })
      .select("name email phone companyName accountStatus")
      .lean();

    if (!builder) {
      return {
        exists: false,
        phone,
        message: "Mobile not registered. Continue to create builder account.",
      };
    }

    return {
      exists: true,
      phone,
      builder: {
        id: String((builder as any)._id),
        name: (builder as any).name,
        email: (builder as any).email,
        companyName: (builder as any).companyName,
        accountStatus: (builder as any).accountStatus,
      },
      message:
        "You are already registered. Verify mobile OTP to approve this project.",
    };
  },

  /**
   * After builder phone-OTP signup (create credential style),
   * claim the invite and attach builder to the draft project.
   */
  async claimInviteAfterPhoneSignup(
    token: string,
    input: {
      phone: string;
      companyName?: string;
      contactName?: string;
      email?: string;
      projectContacts?: ProjectContactInput[];
    },
  ) {
    const invite = await ProjectBuilderInvite.findOne({
      tokenHash: hashToken(token),
      isActive: true,
      mode: "invite_link",
    });
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.statusCode = 404;
      throw err;
    }
    if (invite.expiresAt < new Date()) {
      const err: any = new Error("Invite expired");
      err.statusCode = 410;
      throw err;
    }

    const phone = normalizePhone(input.phone);
    const phoneValues = phoneLookupValues(phone);
    const builderRoleId = await getBuilderRoleId();
    const builder = await User.findOne({
      phone: { $in: phoneValues },
      roleId: builderRoleId,
    });

    if (!builder) {
      const err: any = new Error(
        "Builder account not found. Complete mobile OTP signup first.",
      );
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(invite.projectId);
    ensureDraftProject(project);

    // First builder who completes wins ownership for this draft
    if (project!.createdBy) {
      const err: any = new Error(
        "This project is already claimed by another builder",
      );
      err.statusCode = 409;
      throw err;
    }

    const companyName =
      String(input.companyName || invite.companyName || (builder as any).companyName || "").trim();
    const contactName =
      String(input.contactName || (builder as any).name || "").trim();
    const email = normalizeEmail(input.email || invite.email || (builder as any).email);

    project!.createdBy = builder._id;
    project!.builderOnboarding = {
      enabled: true,
      mode: "invite_link",
      assignStatus: "verified",
      inviteId: invite._id,
      inviteEmail: email || invite.email || "",
      invitePhone: phone,
      emailStatus: "onboarded",
      emailUiStatus: "onboarded",
      verifiedAt: new Date(),
      builderSnapshot: {
        companyName,
        contactName,
        email,
        phone,
      },
    } as any;

    if (Array.isArray(input.projectContacts) && input.projectContacts.length) {
      await this.saveProjectContacts(String(project!._id), input.projectContacts);
    }

    // Mark all active invites for this project as used/closed after first claim
    await ProjectBuilderInvite.updateMany(
      { projectId: project!._id, isActive: true },
      {
        $set: { isActive: false, emailStatus: "onboarded", usedAt: new Date() },
        $push: { statusHistory: { status: "onboarded", at: new Date() } },
      },
    );
    invite.builderUserId = builder._id;
    await invite.save();
    await project!.save();

    return {
      message: "Builder onboarded and project claimed successfully",
      builderId: String(builder._id),
      projectId: String(project!._id),
      assignStatus: "verified",
      previewUrl: `${publicWebBase()}/project/${project!.slug}`,
    };
  },

  /** Path C: staff call/direct — enter details, send OTP */
  async requestDirectOtp(
    projectId: string,
    input: {
      companyName: string;
      contactName: string;
      email: string;
      phone: string;
    },
    staff?: StaffUser,
  ) {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const companyName = String(input.companyName || "").trim();
    const contactName = String(input.contactName || "").trim();

    if (!companyName || !contactName || !email || !phone) {
      const err: any = new Error(
        "companyName, contactName, email and phone are required",
      );
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);

    const existing = await this.lookupBuilder({ email, phone });
    if (existing.found && existing.builders[0]) {
      return {
        alreadyExists: true,
        ...existing,
        message:
          "Builder already exists in database. Use assign-existing (no OTP).",
      };
    }

    await revokeActiveInvites(projectId);

    const rawToken = genToken();
    const trackingId = genTrackingId();
    const otp = genOtp();
    const invite = await ProjectBuilderInvite.create({
      projectId,
      mode: "staff_direct",
      email,
      phone,
      companyName,
      contactName,
      tokenHash: hashToken(rawToken),
      trackingId,
      emailStatus: "queued",
      statusHistory: [{ status: "queued", at: new Date() }],
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      otpHash: hashToken(otp),
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      otpAttempts: 0,
      createdByStaffId: staff?.id
        ? new mongoose.Types.ObjectId(staff.id)
        : undefined,
      isActive: true,
    });

    try {
      await sendEmail({
        to: email,
        subject: `Propenu OTP for ${project!.title}`,
        html: buildBuilderOtpEmailHtml(otp, project!.title),
      });
      pushEmailStatus(invite, "sent");
      pushEmailStatus(invite, "delivered");
      await invite.save();
    } catch (error: any) {
      pushEmailStatus(invite, "failed", { error: error?.message });
      await invite.save();
      const err: any = new Error(
        `Failed to send OTP email: ${error?.message || "unknown error"}`,
      );
      err.statusCode = 502;
      throw err;
    }

    project!.builderOnboarding = {
      enabled: true,
      mode: "staff_direct",
      assignStatus: "otp_pending",
      inviteId: invite._id,
      inviteEmail: email,
      invitePhone: phone,
      emailStatus: invite.emailStatus,
      emailUiStatus: deriveUiEmailStatus(invite),
      builderSnapshot: {
        companyName,
        contactName,
        email,
        phone,
      },
    } as any;
    await project!.save();

    return {
      alreadyExists: false,
      inviteId: String(invite._id),
      email,
      phone,
      assignStatus: "otp_pending",
      message: "OTP sent to builder email. Verify OTP to onboard.",
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
    };
  },

  async verifyDirectOtp(
    projectId: string,
    input: { otp: string; inviteId?: string },
    staff?: StaffUser,
  ) {
    const otp = String(input.otp || "").trim();
    if (!otp) {
      const err: any = new Error("OTP is required");
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);

    const inviteQuery: any = {
      projectId,
      mode: "staff_direct",
      isActive: true,
    };
    if (input.inviteId && mongoose.Types.ObjectId.isValid(input.inviteId)) {
      inviteQuery._id = input.inviteId;
    }

    const invite = await ProjectBuilderInvite.findOne(inviteQuery).sort({
      createdAt: -1,
    });
    if (!invite) {
      const err: any = new Error("No active direct-onboarding invite found");
      err.statusCode = 404;
      throw err;
    }

    if (invite.otpAttempts >= MAX_OTP_ATTEMPTS) {
      const err: any = new Error("Too many OTP attempts. Request a new OTP.");
      err.statusCode = 429;
      throw err;
    }

    if (!invite.otpHash || !invite.otpExpiresAt || invite.otpExpiresAt < new Date()) {
      invite.otpAttempts += 1;
      await invite.save();
      const err: any = new Error("OTP expired. Request a new OTP.");
      err.statusCode = 400;
      throw err;
    }

    if (invite.otpHash !== hashToken(otp)) {
      invite.otpAttempts += 1;
      await invite.save();
      const err: any = new Error("Incorrect OTP");
      err.statusCode = 400;
      throw err;
    }

    const builder = await this.createOrGetBuilderUser({
      name: invite.contactName || "Builder",
      companyName: invite.companyName || "Builder",
      email: invite.email || "",
      phone: invite.phone || "",
    });

    project!.createdBy = builder._id;
    project!.builderOnboarding = {
      enabled: true,
      mode: "staff_direct",
      assignStatus: "verified",
      inviteId: invite._id,
      inviteEmail: invite.email || "",
      invitePhone: invite.phone || "",
      emailStatus: "onboarded",
      emailUiStatus: "onboarded",
      verifiedAt: new Date(),
      verifiedBy: staff?.id
        ? new mongoose.Types.ObjectId(staff.id)
        : undefined,
      builderSnapshot: {
        companyName: invite.companyName || "",
        contactName: invite.contactName || "",
        email: invite.email || "",
        phone: invite.phone || "",
      },
    } as any;

    pushEmailStatus(invite, "onboarded");
    invite.usedAt = new Date();
    invite.builderUserId = builder._id;
    (invite as any).otpHash = undefined;
    (invite as any).otpExpiresAt = undefined;
    await invite.save();
    await project!.save();

    return {
      message: "Builder verified via OTP and assigned to project",
      builderId: String(builder._id),
      assignStatus: "verified",
      createdNewUser: builder.createdNew,
    };
  },

  async saveProjectContacts(projectId: string, contacts: ProjectContactInput[]) {
    if (!Array.isArray(contacts) || contacts.length === 0) {
      const err: any = new Error("At least one project contact is required");
      err.statusCode = 400;
      throw err;
    }

    const normalized = contacts.map((c, index) => {
      const name = String(c.name || "").trim();
      const phone = normalizePhone(c.phone);
      const email = normalizeEmail(c.email);
      if (!name || !phone) {
        const err: any = new Error(
          `Contact #${index + 1}: name and phone are required`,
        );
        err.statusCode = 400;
        throw err;
      }
      return {
        name,
        phone,
        email: email || "",
        role: String(c.role || "").trim(),
        isPrimary: Boolean(c.isPrimary) || index === 0,
      };
    });

    if (!normalized.some((c) => c.isPrimary)) {
      normalized[0]!.isPrimary = true;
    }

    const project = await FeaturedProject.findByIdAndUpdate(
      projectId,
      { $set: { projectContacts: normalized } },
      { new: true },
    )
      .select("title slug status projectContacts builderOnboarding createdBy")
      .lean();

    if (!project) {
      const err: any = new Error("Project not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      message: "Project contacts saved",
      projectContacts: (project as any).projectContacts,
    };
  },

  async submitForApproval(projectId: string, staff?: StaffUser) {
    const project = await FeaturedProject.findById(projectId);
    ensureDraftProject(project);

    const onboarding = (project as any).builderOnboarding;
    if (!project!.createdBy) {
      const err: any = new Error(
        "Assign and verify a builder before submitting for approval",
      );
      err.statusCode = 400;
      throw err;
    }

    if (onboarding?.enabled && onboarding.assignStatus !== "verified") {
      const err: any = new Error(
        "Builder onboarding is not verified yet",
      );
      err.statusCode = 400;
      throw err;
    }

    const contacts = (project as any).projectContacts || [];
    if (!Array.isArray(contacts) || contacts.length === 0) {
      const err: any = new Error(
        "Add at least one project contact person before submission",
      );
      err.statusCode = 400;
      throw err;
    }

    project!.status = "pending";
    project!.approvalStatus = "pending";
    (project as any).rejectedReason = undefined;
    if (staff?.id) {
      (project as any).lastUpdatedBy = {
        userId: new mongoose.Types.ObjectId(staff.id),
        name: staff.name || "",
        email: staff.email || "",
        roleName: staff.roleName || "",
        updatedAt: new Date(),
      };
    }

    await project!.save();

    return {
      message: "Project submitted for approval",
      status: project!.status,
      approvalStatus: project!.approvalStatus,
      createdBy: String(project!.createdBy),
    };
  },

  async markEmailOpened(trackingId: string) {
    const invite = await ProjectBuilderInvite.findOne({ trackingId, isActive: true });
    if (!invite) return false;

    // Keep terminal statuses
    if (!["onboarded", "rejected", "expired", "revoked"].includes(invite.emailStatus)) {
      if (invite.emailStatus !== "clicked") {
        pushEmailStatus(invite, "opened");
      } else {
        invite.openCount = (invite.openCount || 0) + 1;
        if (!invite.openedAt) invite.openedAt = new Date();
      }
      await invite.save();
      await FeaturedProject.updateOne(
        { _id: invite.projectId },
        {
          $set: {
            "builderOnboarding.emailStatus": invite.emailStatus,
            "builderOnboarding.emailUiStatus": deriveUiEmailStatus(invite),
            "builderOnboarding.openedAt": invite.openedAt,
            "builderOnboarding.assignStatus":
              invite.emailStatus === "clicked" ? "clicked" : "opened",
          },
        },
      );
    }
    return true;
  },

  async markEmailClicked(trackingId: string, token?: string) {
    const invite = await ProjectBuilderInvite.findOne({ trackingId });
    if (!invite || !invite.isActive) {
      const err: any = new Error("Invite not found or inactive");
      err.statusCode = 404;
      throw err;
    }

    if (token && invite.tokenHash !== hashToken(token)) {
      const err: any = new Error("Invalid invite token");
      err.statusCode = 403;
      throw err;
    }

    if (invite.expiresAt < new Date()) {
      pushEmailStatus(invite, "expired");
      invite.isActive = false;
      await invite.save();
      const err: any = new Error("Invite link expired");
      err.statusCode = 410;
      throw err;
    }

    pushEmailStatus(invite, "clicked");
    await invite.save();

    const project = await FeaturedProject.findById(invite.projectId)
      .select("slug title status")
      .lean();

    await FeaturedProject.updateOne(
      { _id: invite.projectId },
      {
        $set: {
          "builderOnboarding.emailStatus": "clicked",
          "builderOnboarding.emailUiStatus": "clicked",
          "builderOnboarding.clickedAt": invite.clickedAt,
          "builderOnboarding.assignStatus": "clicked",
        },
      },
    );

    const slug = (project as any)?.slug || "";
    return {
      projectSlug: slug,
      projectTitle: (project as any)?.title,
      previewUrl: `${publicWebBase()}/project/${slug}?invite=${token || ""}`,
      onboardUrl: `${publicWebBase()}/builder/onboard/${token || ""}`,
    };
  },

  async getPublicInvite(token: string) {
    const invite = await ProjectBuilderInvite.findOne({
      tokenHash: hashToken(token),
      isActive: true,
    });
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.statusCode = 404;
      throw err;
    }
    if (invite.expiresAt < new Date()) {
      pushEmailStatus(invite, "expired");
      invite.isActive = false;
      await invite.save();
      const err: any = new Error("Invite expired");
      err.statusCode = 410;
      throw err;
    }

    if (!["clicked", "interested", "opened", "onboarded"].includes(invite.emailStatus)) {
      pushEmailStatus(invite, "interested");
      await invite.save();
    }

    const project = await FeaturedProject.findById(invite.projectId)
      .select(
        "title slug city locality state address heroImage heroTagline status builderOnboarding",
      )
      .lean();

    if (!project) {
      const err: any = new Error("Project not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      invite: {
        email: invite.email,
        phone: invite.phone,
        companyName: invite.companyName,
        expiresAt: invite.expiresAt,
        emailStatus: invite.emailStatus,
      },
      project: {
        title: (project as any).title,
        slug: (project as any).slug,
        city: (project as any).city,
        locality: (project as any).locality,
        state: (project as any).state,
        address: (project as any).address,
        heroImage: (project as any).heroImage,
        heroTagline: (project as any).heroTagline,
        previewUrl: `${publicWebBase()}/project/${(project as any).slug}`,
      },
    };
  },

  async requestInviteOtp(token: string) {
    const invite = await ProjectBuilderInvite.findOne({
      tokenHash: hashToken(token),
      isActive: true,
      mode: "invite_link",
    });
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.statusCode = 404;
      throw err;
    }
    if (!invite.email) {
      const err: any = new Error("Invite email missing");
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(invite.projectId)
      .select("title")
      .lean();
    const otp = genOtp();
    invite.otpHash = hashToken(otp);
    invite.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    invite.otpAttempts = 0;
    pushEmailStatus(invite, "interested");
    await invite.save();

    await sendEmail({
      to: invite.email,
      subject: `Propenu OTP for ${(project as any)?.title || "project onboarding"}`,
      html: buildBuilderOtpEmailHtml(
        otp,
        (project as any)?.title || "your project",
      ),
    });

    return {
      message: "OTP sent to invite email",
      email: invite.email,
      ...(process.env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
    };
  },

  async completeInviteOnboarding(
    token: string,
    input: {
      otp: string;
      companyName: string;
      contactName: string;
      phone: string;
      email?: string;
      projectContacts?: ProjectContactInput[];
    },
  ) {
    const invite = await ProjectBuilderInvite.findOne({
      tokenHash: hashToken(token),
      isActive: true,
      mode: "invite_link",
    });
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.statusCode = 404;
      throw err;
    }
    if (invite.expiresAt < new Date()) {
      const err: any = new Error("Invite expired");
      err.statusCode = 410;
      throw err;
    }

    const otp = String(input.otp || "").trim();
    if (!otp) {
      const err: any = new Error("OTP is required");
      err.statusCode = 400;
      throw err;
    }
    if (invite.otpAttempts >= MAX_OTP_ATTEMPTS) {
      const err: any = new Error("Too many OTP attempts");
      err.statusCode = 429;
      throw err;
    }
    if (!invite.otpHash || !invite.otpExpiresAt || invite.otpExpiresAt < new Date()) {
      invite.otpAttempts += 1;
      await invite.save();
      const err: any = new Error("OTP expired. Request a new OTP.");
      err.statusCode = 400;
      throw err;
    }
    if (invite.otpHash !== hashToken(otp)) {
      invite.otpAttempts += 1;
      await invite.save();
      const err: any = new Error("Incorrect OTP");
      err.statusCode = 400;
      throw err;
    }

    const companyName = String(input.companyName || invite.companyName || "").trim();
    const contactName = String(input.contactName || "").trim();
    const phone = normalizePhone(input.phone || invite.phone);
    const email = normalizeEmail(input.email || invite.email);

    if (!companyName || !contactName || !phone || !email) {
      const err: any = new Error(
        "companyName, contactName, phone and email are required",
      );
      err.statusCode = 400;
      throw err;
    }

    const project = await FeaturedProject.findById(invite.projectId);
    ensureDraftProject(project);

    const builder = await this.createOrGetBuilderUser({
      name: contactName,
      companyName,
      email,
      phone,
    });

    project!.createdBy = builder._id;
    project!.builderOnboarding = {
      enabled: true,
      mode: "invite_link",
      assignStatus: "verified",
      inviteId: invite._id,
      inviteEmail: email,
      invitePhone: phone,
      emailStatus: "onboarded",
      emailUiStatus: "onboarded",
      verifiedAt: new Date(),
      builderSnapshot: {
        companyName,
        contactName,
        email,
        phone,
      },
    } as any;

    if (Array.isArray(input.projectContacts) && input.projectContacts.length) {
      await this.saveProjectContacts(
        String(project!._id),
        input.projectContacts,
      );
    }

    pushEmailStatus(invite, "onboarded");
    invite.usedAt = new Date();
    invite.builderUserId = builder._id;
    invite.companyName = companyName;
    invite.contactName = contactName;
    invite.phone = phone;
    invite.email = email;
    (invite as any).otpHash = undefined;
    (invite as any).otpExpiresAt = undefined;
    await invite.save();
    await project!.save();

    return {
      message: "Builder onboarded successfully",
      builderId: String(builder._id),
      projectId: String(project!._id),
      assignStatus: "verified",
      createdNewUser: builder.createdNew,
      previewUrl: `${publicWebBase()}/project/${project!.slug}`,
    };
  },

  async createOrGetBuilderUser(input: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
  }) {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const phoneValues = phoneLookupValues(phone);
    const builderRoleId = await getBuilderRoleId();

    let user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phoneValues.length ? [{ phone: { $in: phoneValues } }] : []),
      ],
    });

    if (user) {
      if (!(user as any).roleId) {
        (user as any).roleId = builderRoleId;
      }
      if (!(user as any).companyName && input.companyName) {
        (user as any).companyName = input.companyName;
      }
      (user as any).phoneVerified = true;
      if ((user as any).accountStatus !== "active") {
        (user as any).accountStatus = "active";
      }
      await user.save();
      return { ...user.toObject(), _id: user._id, createdNew: false };
    }

    user = await User.create({
      name: input.name.slice(0, 42),
      companyName: input.companyName.slice(0, 80),
      email,
      phone,
      phoneVerified: true,
      accountStatus: "active",
      roleId: builderRoleId,
      isActive: true,
    });

    return { ...user.toObject(), _id: user._id, createdNew: true };
  },

  isBuilderOnboardingBlocking(project: any) {
    const onboarding = project?.builderOnboarding;
    if (!onboarding?.enabled) return false;
    return onboarding.assignStatus !== "verified" || !project?.createdBy;
  },
};
