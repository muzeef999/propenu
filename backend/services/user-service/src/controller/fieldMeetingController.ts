import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";
import FieldMeeting, {
  FIELD_MEETING_STATUSES,
  FIELD_MEETING_TYPES,
} from "../models/fieldMeetingModel";
import User from "../models/userModel";
import Role from "../models/roleModel";
import {
  actorCanAccessMeeting,
  buildVisibilityChain,
  canonicalFieldMeetingRole,
  defaultPrepTasks,
  FIELD_MEETING_STAFF_ROLES,
  getVisibleOwnerIds,
} from "../utils/fieldMeetingAccess";

const asId = (v: any) => (v ? String(v._id || v) : "");

const parseLocalDay = (value?: string, end = false): Date | null => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return end
    ? new Date(y, mo, d, 23, 59, 59, 999)
    : new Date(y, mo, d, 0, 0, 0, 0);
};

const combineDateTime = (dateStr: string, timeStr: string): Date | null => {
  const d = String(dateStr || "").trim();
  const t = String(timeStr || "").trim();
  if (!d || !t) return null;
  // Accept HH:mm or h:mm AM/PM
  let hours = 0;
  let minutes = 0;
  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    hours = Number(ampm[1]) % 12;
    if (String(ampm[3]).toUpperCase() === "PM") hours += 12;
    minutes = Number(ampm[2]);
  } else {
    const parts = t.split(":");
    hours = Number(parts[0]);
    minutes = Number(parts[1] || 0);
  }
  const day = parseLocalDay(d, false);
  if (!day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  day.setHours(hours, minutes, 0, 0);
  return day;
};

const assertStaff = (req: AuthRequest) => {
  const role = canonicalFieldMeetingRole(req.user?.roleName);
  const perms = req.user?.permissions || [];
  if (
    !FIELD_MEETING_STAFF_ROLES.has(role) &&
    !perms.includes("dashboard:view") &&
    !perms.includes("user:create")
  ) {
    return false;
  }
  return true;
};

const serializeMeeting = (doc: any) => {
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const prepTasks = Array.isArray(o.prepTasks) ? o.prepTasks : [];
  const prepDone = prepTasks.filter((t: any) => t.completed).length;
  return {
    id: String(o._id),
    _id: String(o._id),
    title: o.title || "",
    meetingType: o.meetingType,
    mode: o.mode,
    status: o.status,
    scheduledStart: o.scheduledStart,
    scheduledEnd: o.scheduledEnd,
    ownerUserId: asId(o.ownerUserId),
    createdBy: asId(o.createdBy),
    client: {
      id: asId(o.client?.userId) || null,
      userId: asId(o.client?.userId) || null,
      name: o.client?.name || "",
      company: o.client?.company || "",
      phone: o.client?.phone || "",
      email: o.client?.email || "",
      roleName: o.client?.roleName || "user",
      createdInline: Boolean(o.client?.createdInline),
    },
    location: {
      state: o.location?.state || "",
      city: o.location?.city || "",
      locality: o.location?.locality || "",
      address: o.location?.address || "",
    },
    linkedProperty: o.linkedProperty || null,
    objective: o.objective || "",
    notes: o.notes || "",
    outcome: o.outcome || "",
    prepTasks: prepTasks.map((t: any) => ({
      id: String(t._id || t.id || t.key),
      key: t.key || "",
      title: t.title,
      description: t.description || "",
      completed: Boolean(t.completed),
      completedAt: t.completedAt || null,
    })),
    prepCompletedCount: prepDone,
    prepTotalCount: prepTasks.length,
    wizardStep: o.wizardStep || 1,
    visibility: Array.isArray(o.visibilityChain) ? o.visibilityChain : [],
    visibilityChain: Array.isArray(o.visibilityChain) ? o.visibilityChain : [],
    cancelledReason: o.cancelledReason || "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
};

const resolveOwnerId = async (req: AuthRequest, bodyOwner?: string) => {
  const actorId = String(req.user?.sub || req.user?.id || "");
  const role = canonicalFieldMeetingRole(req.user?.roleName);
  if (role === "sales_executive" || role === "sales_agent") {
    return actorId;
  }
  const requested = String(bodyOwner || "").trim();
  if (requested && mongoose.Types.ObjectId.isValid(requested)) {
    const ok = await actorCanAccessMeeting(actorId, req.user?.roleName, requested);
    if (!ok) return null;
    return requested;
  }
  return actorId;
};

async function createInlineClient(
  actorId: string,
  ownerId: string,
  payload: any,
) {
  const name = String(payload?.name || "").trim();
  const phone = String(payload?.phone || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const company = String(payload?.company || "").trim();
  const intent = String(payload?.roleIntent || payload?.roleName || "user")
    .trim()
    .toLowerCase();
  const state = String(payload?.state || "").trim();
  const city = String(payload?.city || "Hyderabad").trim();
  const locality = String(payload?.locality || "").trim();

  if (!name || name.length < 3) throw new Error("Client name must be at least 3 characters");
  if (!phone && !email) throw new Error("Client phone or email is required");

  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length === 10) normalizedPhone = `+91${normalizedPhone}`;
  else if (normalizedPhone && !phone.startsWith("+")) normalizedPhone = `+${normalizedPhone}`;
  else if (phone.startsWith("+")) normalizedPhone = phone.replace(/\s+/g, "");
  const phoneToSave = normalizedPhone || undefined;

  if (phoneToSave) {
    const existing = await User.findOne({ phone: phoneToSave })
      .select("_id name email phone companyName managerId")
      .lean();
    if (existing) {
      return { user: existing, created: false };
    }
  }
  if (email) {
    const existing = await User.findOne({ email })
      .select("_id name email phone companyName managerId")
      .lean();
    if (existing) {
      return { user: existing, created: false };
    }
  }

  const roleKey =
    intent === "agent" ? "agent" : intent === "builder" ? "builder" : "user";
  const role = await Role.findOne({ name: roleKey }).select("_id name").lean();
  if (!role) throw new Error(`Role ${roleKey} not found`);

  const safeCity = city.length >= 3 ? city : "Hyderabad";

  const user = await User.create({
    name,
    phone: phoneToSave,
    email: email || undefined,
    companyName: company || undefined,
    state: state || undefined,
    city: safeCity,
    locality: locality || undefined,
    roleId: role._id,
    managerId: new mongoose.Types.ObjectId(ownerId),
    onboardedBy: new mongoose.Types.ObjectId(actorId),
    accountStatus: "location_pending",
    phoneVerified: false,
    isActive: true,
    kyc: { status: "not_started" },
  });

  return { user, created: true };
}

export const listFieldMeetings = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const actorId = String(req.user?.sub || req.user?.id || "");
    const visible = await getVisibleOwnerIds(actorId, req.user?.roleName);

    const filter: Record<string, any> = {};
    if (visible !== "all") {
      filter.ownerUserId = {
        $in: visible.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    const status = String(req.query.status || "").trim().toLowerCase();
    if (status && status !== "all" && FIELD_MEETING_STATUSES.includes(status as any)) {
      filter.status = status;
    }

    const ownerUserId = String(req.query.ownerUserId || "").trim();
    if (ownerUserId && mongoose.Types.ObjectId.isValid(ownerUserId)) {
      if (visible !== "all" && !visible.includes(ownerUserId)) {
        return res.status(403).json({ message: "Cannot view this owner's meetings" });
      }
      filter.ownerUserId = new mongoose.Types.ObjectId(ownerUserId);
    }

    const from = parseLocalDay(req.query.from as string, false);
    const to = parseLocalDay(req.query.to as string, true);
    if (from || to) {
      filter.scheduledStart = {};
      if (from) filter.scheduledStart.$gte = from;
      if (to) filter.scheduledStart.$lte = to;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      FieldMeeting.find(filter).sort({ scheduledStart: 1 }).skip(skip).limit(limit).lean(),
      FieldMeeting.countDocuments(filter),
    ]);

    // Today prep tasks for actor-owned meetings
    const todayFrom = parseLocalDay(
      new Date().toISOString().slice(0, 10),
      false,
    )!;
    const todayTo = parseLocalDay(new Date().toISOString().slice(0, 10), true)!;
    const todayFilter: Record<string, any> = {
      ownerUserId:
        visible === "all"
          ? filter.ownerUserId || { $exists: true }
          : { $in: (visible as string[]).map((id) => new mongoose.Types.ObjectId(id)) },
      scheduledStart: { $gte: todayFrom, $lte: todayTo },
      status: { $nin: ["cancelled", "draft"] },
    };
    if (filter.ownerUserId) todayFilter.ownerUserId = filter.ownerUserId;

    const todayMeetings = await FieldMeeting.find(todayFilter)
      .sort({ scheduledStart: 1 })
      .limit(40)
      .lean();

    const prepTasks = todayMeetings.flatMap((m: any) =>
      (m.prepTasks || []).map((t: any) => ({
        id: String(t._id),
        meetingId: String(m._id),
        meetingClient: m.client?.name || "",
        key: t.key,
        title: t.title,
        description: t.description || "",
        completed: Boolean(t.completed),
        scheduledStart: m.scheduledStart,
      })),
    );

    return res.json({
      success: true,
      data: {
        meetings: rows.map(serializeMeeting),
        todayMeetings: todayMeetings.map(serializeMeeting),
        prepTasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 0,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to list field meetings",
      error: error.message,
    });
  }
};

export const getFieldMeetingById = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid meeting id" });
    }
    const meeting = await FieldMeeting.findById(id).lean();
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const actorId = String(req.user?.sub || req.user?.id || "");
    const ok = await actorCanAccessMeeting(
      actorId,
      req.user?.roleName,
      asId(meeting.ownerUserId),
    );
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    return res.json({ success: true, data: serializeMeeting(meeting) });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createFieldMeeting = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const actorId = String(req.user?.sub || req.user?.id || "");
    const body = req.body || {};
    const asDraft = Boolean(body.draft || body.status === "draft");

    const ownerId = await resolveOwnerId(req, body.ownerUserId);
    if (!ownerId) {
      return res.status(403).json({ message: "Invalid meeting owner" });
    }

    let clientUserId = String(body.clientUserId || body.client?.userId || "").trim();
    let clientSnap: any = {
      name: String(body.client?.name || "").trim(),
      company: String(body.client?.company || "").trim(),
      phone: String(body.client?.phone || "").trim(),
      email: String(body.client?.email || "").trim(),
      roleName: String(body.client?.roleName || "user").trim(),
      createdInline: false,
    };

    if (body.createClient && typeof body.createClient === "object") {
      const { user, created } = await createInlineClient(
        actorId,
        ownerId,
        {
          ...body.createClient,
          state: body.createClient.state || body.location?.state,
          city: body.createClient.city || body.location?.city,
          locality: body.createClient.locality || body.location?.locality,
        },
      );
      clientUserId = String(user._id);
      clientSnap = {
        userId: user._id,
        name: user.name || body.createClient.name,
        company: body.createClient.company || (user as any).companyName || "",
        phone: user.phone || body.createClient.phone || "",
        email: user.email || body.createClient.email || "",
        roleName: body.createClient.roleIntent || body.createClient.roleName || "user",
        createdInline: created,
      };
      if (!created && !(user as any).managerId) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              managerId: new mongoose.Types.ObjectId(ownerId),
              onboardedBy: new mongoose.Types.ObjectId(actorId),
            },
          },
        );
      }
    } else if (clientUserId && mongoose.Types.ObjectId.isValid(clientUserId)) {
      const user = await User.findById(clientUserId)
        .select("name phone email companyName roleId managerId")
        .populate("roleId", "name")
        .lean();
      if (user) {
        clientSnap = {
          userId: user._id,
          name: clientSnap.name || user.name || "",
          company: clientSnap.company || (user as any).companyName || "",
          phone: clientSnap.phone || user.phone || "",
          email: clientSnap.email || user.email || "",
          roleName:
            clientSnap.roleName ||
            (user.roleId as any)?.name ||
            "user",
          createdInline: false,
        };
        // Soft-claim only when unassigned — does not change KYC / onboard status
        if (!user.managerId) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                managerId: new mongoose.Types.ObjectId(ownerId),
                onboardedBy: new mongoose.Types.ObjectId(actorId),
              },
            },
          );
        }
      }
    }

    if (!asDraft && !clientSnap.name && !clientUserId) {
      return res.status(400).json({ message: "Client is required" });
    }

    const meetingType = (FIELD_MEETING_TYPES as readonly string[]).includes(
      String(body.meetingType || ""),
    )
      ? body.meetingType
      : "site_visit";

    let start =
      body.scheduledStart
        ? new Date(body.scheduledStart)
        : combineDateTime(body.date, body.startTime);
    let end =
      body.scheduledEnd
        ? new Date(body.scheduledEnd)
        : combineDateTime(body.date, body.endTime);

    if (!start || Number.isNaN(start.getTime())) {
      if (asDraft) start = new Date();
      else return res.status(400).json({ message: "Valid start date/time required" });
    }
    if (!end || Number.isNaN(end.getTime())) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    if (end.getTime() <= start.getTime()) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const remote = ["video_call", "phone_call"].includes(meetingType);
    const location = {
      state: remote ? "" : String(body.location?.state || "").trim(),
      city: remote ? "" : String(body.location?.city || "").trim(),
      locality: remote ? "" : String(body.location?.locality || "").trim(),
      address: String(body.location?.address || "").trim(),
    };

    if (!asDraft && !remote && !location.state) {
      return res.status(400).json({ message: "State is required for in-person meetings" });
    }

    const prepTasks =
      Array.isArray(body.prepTasks) && body.prepTasks.length
        ? body.prepTasks.map((t: any) => ({
            key: t.key || "",
            title: t.title || "Task",
            description: t.description || "",
            completed: Boolean(t.completed),
            completedAt: t.completed ? new Date() : null,
          }))
        : defaultPrepTasks();

    const allPrepDone = prepTasks.every((t: any) => t.completed);
    let status = String(body.status || "").toLowerCase();
    if (!FIELD_MEETING_STATUSES.includes(status as any)) {
      status = asDraft ? "draft" : allPrepDone ? "planned" : "prep_pending";
    }

    const visibilityChain = await buildVisibilityChain(ownerId);
    const mode =
      meetingType === "video_call"
        ? "video"
        : meetingType === "phone_call"
          ? "phone"
          : "in_person";

    const meeting = await FieldMeeting.create({
      title: String(body.title || clientSnap.name || "Field meeting").trim(),
      meetingType,
      mode: body.mode || mode,
      status,
      scheduledStart: start,
      scheduledEnd: end,
      ownerUserId: new mongoose.Types.ObjectId(ownerId),
      createdBy: new mongoose.Types.ObjectId(actorId),
      client: {
        ...clientSnap,
        userId: clientUserId && mongoose.Types.ObjectId.isValid(clientUserId)
          ? new mongoose.Types.ObjectId(clientUserId)
          : clientSnap.userId || null,
      },
      location,
      linkedProperty: body.linkedProperty
        ? {
            id: String(body.linkedProperty.id || ""),
            name: String(body.linkedProperty.name || ""),
            category: String(body.linkedProperty.category || ""),
            location: String(body.linkedProperty.location || ""),
            priceLabel: String(body.linkedProperty.priceLabel || ""),
          }
        : null,
      objective: String(body.objective || "").trim(),
      notes: String(body.notes || "").trim(),
      prepTasks,
      wizardStep: Number(body.wizardStep) || (asDraft ? 1 : 5),
      visibilityChain,
    });

    return res.status(201).json({
      success: true,
      message: asDraft ? "Draft saved" : "Meeting scheduled successfully",
      data: serializeMeeting(meeting),
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to create meeting",
    });
  }
};

export const updateFieldMeeting = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid meeting id" });
    }
    const meeting = await FieldMeeting.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const actorId = String(req.user?.sub || req.user?.id || "");
    const ok = await actorCanAccessMeeting(
      actorId,
      req.user?.roleName,
      asId(meeting.ownerUserId),
    );
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const body = req.body || {};
    if (
      body.meetingType &&
      (FIELD_MEETING_TYPES as readonly string[]).includes(String(body.meetingType))
    ) {
      meeting.meetingType = body.meetingType;
    }
    if (
      body.status &&
      (FIELD_MEETING_STATUSES as readonly string[]).includes(String(body.status))
    ) {
      meeting.status = body.status;
    }
    if (body.date || body.startTime || body.scheduledStart) {
      const start = body.scheduledStart
        ? new Date(body.scheduledStart)
        : combineDateTime(body.date || meeting.scheduledStart.toISOString().slice(0, 10), body.startTime);
      if (start && !Number.isNaN(start.getTime())) meeting.scheduledStart = start;
    }
    if (body.date || body.endTime || body.scheduledEnd) {
      const end = body.scheduledEnd
        ? new Date(body.scheduledEnd)
        : combineDateTime(
            body.date || meeting.scheduledStart.toISOString().slice(0, 10),
            body.endTime,
          );
      if (end && !Number.isNaN(end.getTime())) meeting.scheduledEnd = end;
    }
    if (meeting.scheduledEnd.getTime() <= meeting.scheduledStart.getTime()) {
      return res.status(400).json({ message: "End time must be after start time" });
    }
    if (body.location) {
      meeting.location = {
        state: String(body.location.state ?? meeting.location?.state ?? ""),
        city: String(body.location.city ?? meeting.location?.city ?? ""),
        locality: String(body.location.locality ?? meeting.location?.locality ?? ""),
        address: String(body.location.address ?? meeting.location?.address ?? ""),
      } as any;
    }
    if (body.notes != null) meeting.notes = String(body.notes);
    if (body.objective != null) meeting.objective = String(body.objective);
    if (body.outcome != null) meeting.outcome = String(body.outcome);
    if (body.cancelledReason != null) meeting.cancelledReason = String(body.cancelledReason);
    if (body.linkedProperty !== undefined) {
      meeting.linkedProperty = body.linkedProperty || null;
    }
    if (Array.isArray(body.prepTasks)) {
      meeting.prepTasks = body.prepTasks as any;
    }
    if (body.wizardStep != null) meeting.wizardStep = Number(body.wizardStep) || 1;

    await meeting.save();
    return res.json({
      success: true,
      message: "Meeting updated",
      data: serializeMeeting(meeting),
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updatePrepTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const id = String(req.params.id || "");
    const taskId = String(req.params.taskId || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid meeting id" });
    }
    const meeting = await FieldMeeting.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    const actorId = String(req.user?.sub || req.user?.id || "");
    const ok = await actorCanAccessMeeting(
      actorId,
      req.user?.roleName,
      asId(meeting.ownerUserId),
    );
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const task = meeting.prepTasks.id(taskId as any) ||
      meeting.prepTasks.find((t: any) => String(t._id) === taskId || t.key === taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const completed = Boolean(req.body?.completed);
    (task as any).completed = completed;
    (task as any).completedAt = completed ? new Date() : null;

    const allDone = meeting.prepTasks.every((t: any) => t.completed);
    if (meeting.status === "prep_pending" && allDone) {
      meeting.status = "planned";
    } else if (
      ["planned", "confirmed"].includes(meeting.status) &&
      !allDone
    ) {
      meeting.status = "prep_pending";
    }

    await meeting.save();
    return res.json({ success: true, data: serializeMeeting(meeting) });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getFieldMeetingTerritory = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const actorId = String(req.user?.sub || req.user?.id || "");
    const ownerId = String(req.query.ownerUserId || actorId);
    const ok = await actorCanAccessMeeting(actorId, req.user?.roleName, ownerId);
    if (!ok) return res.status(403).json({ message: "Forbidden" });

    const user = await User.findById(ownerId)
      .select("name state city locality workingLocations")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const territories = Array.isArray(user.workingLocations)
      ? user.workingLocations
      : [];
    const labels = territories.length
      ? territories.map((t: any) => {
          if (!t.city) return `${t.state} (entire state)`;
          if (!t.locality) return `${t.city}, ${t.state}`;
          return `${t.locality}, ${t.city}, ${t.state}`;
        })
      : user.state
        ? [`${user.locality || user.city || user.state}`]
        : [];

    return res.json({
      success: true,
      data: {
        ownerUserId: ownerId,
        homeLocation: {
          state: user.state || "",
          city: user.city || "",
          locality: user.locality || "",
        },
        workingLocations: territories,
        labels,
        primaryLabel: labels[0] || user.state || "Territory not assigned",
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFieldMeetingTeamSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertStaff(req)) return res.status(403).json({ message: "Forbidden" });
    const actorId = String(req.user?.sub || req.user?.id || "");
    const role = canonicalFieldMeetingRole(req.user?.roleName);
    if (role === "sales_executive" || role === "sales_agent") {
      return res.status(403).json({ message: "Team summary is for managers" });
    }

    const visible = await getVisibleOwnerIds(actorId, req.user?.roleName);
    const ownerFilter =
      visible === "all"
        ? {}
        : {
            ownerUserId: {
              $in: visible.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };

    const from = parseLocalDay(req.query.from as string, false);
    const to = parseLocalDay(req.query.to as string, true);
    const match: Record<string, any> = { ...ownerFilter };
    if (from || to) {
      match.scheduledStart = {};
      if (from) match.scheduledStart.$gte = from;
      if (to) match.scheduledStart.$lte = to;
    }

    const grouped = await FieldMeeting.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$ownerUserId",
          total: { $sum: 1 },
          planned: {
            $sum: { $cond: [{ $in: ["$status", ["planned", "confirmed", "prep_pending"]] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          prepPending: {
            $sum: { $cond: [{ $eq: ["$status", "prep_pending"] }, 1, 0] },
          },
        },
      },
    ]);

    const ownerIds = grouped.map((g) => g._id);
    const owners = await User.find({ _id: { $in: ownerIds } })
      .select("name email phone roleId")
      .populate("roleId", "name label")
      .lean();
    const ownerMap = new Map(owners.map((u) => [String(u._id), u]));

    const team = grouped.map((g) => {
      const u: any = ownerMap.get(String(g._id)) || {};
      return {
        ownerUserId: String(g._id),
        name: u.name || "Unknown",
        roleName: u.roleId?.name || "",
        roleLabel: u.roleId?.label || "",
        total: g.total,
        planned: g.planned,
        completed: g.completed,
        cancelled: g.cancelled,
        prepPending: g.prepPending,
      };
    });

    return res.json({
      success: true,
      data: {
        team,
        totals: {
          meetings: team.reduce((s, r) => s + r.total, 0),
          completed: team.reduce((s, r) => s + r.completed, 0),
          prepPending: team.reduce((s, r) => s + r.prepPending, 0),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
