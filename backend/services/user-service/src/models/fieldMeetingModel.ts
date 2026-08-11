import mongoose, { Schema } from "mongoose";

/**
 * Field Meetings CRM — separate collection.
 * Platform User link is optional. "Create & schedule" clients use FieldMeetingContact
 * (separate book) — never creates login credentials.
 */

export const FIELD_MEETING_STATUSES = [
  "draft",
  "planned",
  "prep_pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
] as const;

export type FieldMeetingStatus = (typeof FIELD_MEETING_STATUSES)[number];

export const FIELD_MEETING_TYPES = [
  "sales",
  "marketing",
  "service_meeting",
  "office_meeting",
  "video_call",
  "phone_call",
  "follow_up",
  // legacy (kept so older meetings still load)
  "site_visit",
  "property_discussion",
  "builder_meeting",
] as const;

/** Place / venue context for the meeting type */
export const FIELD_MEETING_PLACES = [
  "on_site",
  "off_site",
  "service_meeting",
  "office",
  "remote",
] as const;

export type FieldMeetingPlace = (typeof FIELD_MEETING_PLACES)[number];

/** Normalize place for schema — never returns empty string (breaks mongoose enum). */
export const normalizeMeetingPlace = (
  meetingType: string,
  raw?: unknown,
): FieldMeetingPlace | undefined => {
  const place = String(raw || "")
    .trim()
    .toLowerCase();
  if ((FIELD_MEETING_PLACES as readonly string[]).includes(place)) {
    return place as FieldMeetingPlace;
  }
  const type = String(meetingType || "").trim().toLowerCase();
  if (type === "video_call" || type === "phone_call") return "remote";
  if (type === "office_meeting") return "office";
  if (
    type === "sales" ||
    type === "marketing" ||
    type === "service_meeting" ||
    type === "site_visit" ||
    type === "property_discussion" ||
    type === "builder_meeting"
  ) {
    return "on_site";
  }
  if (type === "follow_up") return "office";
  return undefined;
};

/** How the meeting entered the CRM calendar */
export const FIELD_MEETING_LOGGING_MODES = [
  "scheduled", // planned ahead
  "walk_in", // sudden / unplanned visit happening now
  "already_visited", // retroactive log — visit already happened
] as const;

export type FieldMeetingLoggingMode = (typeof FIELD_MEETING_LOGGING_MODES)[number];

const PrepTaskSchema = new Schema(
  {
    key: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: true },
);

const PersonSnapshotSchema = new Schema(
  {
    /** Existing Propenu marketplace user (only when selected from search) */
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    /** Field-meeting contact book id (Create & schedule / meeting-only clients) */
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "FieldMeetingContact",
      default: null,
    },
    name: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    /** Job title at the meeting: CEO, Manager, Head, Owner, … */
    title: { type: String, trim: true, default: "" },
    /** Contact-book type label: owner | agent | builder | other */
    roleName: { type: String, trim: true, default: "owner" },
    isPrimary: { type: Boolean, default: false },
    /** true = stored in FieldMeetingContact, not Users collection */
    createdInline: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["platform_user", "meeting_contact"],
      default: "meeting_contact",
    },
  },
  { _id: true },
);

const LocationSchema = new Schema(
  {
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    locality: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const LinkedPropertySchema = new Schema(
  {
    id: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    priceLabel: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const fieldMeetingSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    meetingType: {
      type: String,
      enum: FIELD_MEETING_TYPES,
      default: "sales",
      index: true,
    },
    /**
     * on_site | off_site | service_meeting | office | remote
     * No mongoose enum — empty string used to fail validation. App-layer normalizeMeetingPlace.
     */
    meetingPlace: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      required: false,
      index: true,
      set: (v: unknown) => {
        if (v === undefined || v === null || v === "") return null;
        const s = String(v).trim().toLowerCase();
        return (FIELD_MEETING_PLACES as readonly string[]).includes(s) ? s : null;
      },
      validate: {
        validator: (v: unknown) =>
          v === null ||
          v === undefined ||
          (FIELD_MEETING_PLACES as readonly string[]).includes(String(v)),
        message: "Invalid meetingPlace value",
      },
    },
    mode: {
      type: String,
      enum: ["in_person", "video", "phone"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: FIELD_MEETING_STATUSES,
      default: "planned",
      index: true,
    },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true },
    /** Sales Executive (or staff) who owns this meeting */
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Primary person (first / marked primary) — kept for list cards */
    client: { type: PersonSnapshotSchema, default: () => ({}) },
    /** All people met in this meeting (CEO, managers, heads, …) */
    people: { type: [PersonSnapshotSchema], default: [] },
    location: { type: LocationSchema, default: () => ({}) },
    linkedProperty: { type: LinkedPropertySchema, default: null },
    objective: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    outcome: { type: String, trim: true, default: "" },
    /** scheduled | walk_in | already_visited */
    loggingMode: {
      type: String,
      enum: FIELD_MEETING_LOGGING_MODES,
      default: "scheduled",
      index: true,
    },
    /** Staff confirmed the visit already took place (already_visited mode) */
    visitConfirmed: { type: Boolean, default: false },
    visitConfirmedAt: { type: Date, default: null },
    visitConfirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    prepTasks: { type: [PrepTaskSchema], default: [] },
    wizardStep: { type: Number, default: 1 },
    visibilityChain: [{ type: String, trim: true }],
    cancelledReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

fieldMeetingSchema.index({ ownerUserId: 1, scheduledStart: -1 });
fieldMeetingSchema.index({ status: 1, scheduledStart: -1 });
fieldMeetingSchema.index({ "client.phone": 1 });
fieldMeetingSchema.index({ createdAt: -1 });

const FieldMeeting = mongoose.model("FieldMeeting", fieldMeetingSchema);
export default FieldMeeting;
