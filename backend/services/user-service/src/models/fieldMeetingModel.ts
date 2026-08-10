import mongoose, { Schema } from "mongoose";

/**
 * Field Meetings CRM — separate collection.
 * Does not modify User onboarding / KYC flows; optional clientUserId links to User.
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
  "site_visit",
  "office_meeting",
  "video_call",
  "phone_call",
  "builder_meeting",
  "property_discussion",
  "follow_up",
] as const;

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

const ClientSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    roleName: { type: String, trim: true, default: "user" },
    createdInline: { type: Boolean, default: false },
  },
  { _id: false },
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
      default: "site_visit",
      index: true,
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
    client: { type: ClientSnapshotSchema, default: () => ({}) },
    location: { type: LocationSchema, default: () => ({}) },
    linkedProperty: { type: LinkedPropertySchema, default: null },
    objective: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    outcome: { type: String, trim: true, default: "" },
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
