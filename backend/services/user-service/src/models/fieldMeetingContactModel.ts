import mongoose, { Schema } from "mongoose";

/**
 * Separate CRM contact book for Field Meetings.
 * NOT a platform User — no login, credentials, KYC, or role assignment.
 * One contact can have many meetings (meetingIds).
 */
const fieldMeetingContactSchema = new Schema(
  {
    /** Sales Executive (or staff) who owns this contact in their field book */
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
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, default: "", index: true },
    email: { type: String, trim: true, lowercase: true, default: "", index: true },
    company: { type: String, trim: true, default: "" },
    /** Intent label only — not a Role document */
    clientType: {
      type: String,
      enum: ["owner", "agent", "builder", "other"],
      default: "owner",
    },
    /** Job title at company: CEO, Manager, Head, … */
    title: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    locality: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    /** All FieldMeeting ids linked to this contact */
    meetingIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "FieldMeeting" }],
      default: [],
    },
    meetingCount: { type: Number, default: 0 },
    lastMeetingAt: { type: Date, default: null },
    source: {
      type: String,
      enum: ["field_meeting_create", "field_meeting_import"],
      default: "field_meeting_create",
    },
  },
  { timestamps: true },
);

fieldMeetingContactSchema.index({ ownerUserId: 1, phone: 1 });
fieldMeetingContactSchema.index({ ownerUserId: 1, email: 1 });
fieldMeetingContactSchema.index({ ownerUserId: 1, name: 1 });

const FieldMeetingContact = mongoose.model(
  "FieldMeetingContact",
  fieldMeetingContactSchema,
);

export default FieldMeetingContact;
