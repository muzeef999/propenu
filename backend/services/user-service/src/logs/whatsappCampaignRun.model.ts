import mongoose from "mongoose";

/**
 * Production campaign run ledger — HTTP accepts immediately (202),
 * worker fan-out updates status while recipients are queued/sent.
 */
const schema = new mongoose.Schema(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["crm", "csv"], required: true },
    templateName: { type: String, required: true },
    status: {
      type: String,
      enum: ["accepted", "preparing", "queuing", "queued", "failed"],
      default: "accepted",
      index: true,
    },
    estimatedRecipients: { type: Number, default: 0 },
    queued: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    headerMediaId: { type: String },
    headerImageUrl: { type: String },
    filter: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
  },
  { timestamps: true },
);

export const WhatsAppCampaignRun = mongoose.model(
  "WhatsAppCampaignRun",
  schema,
);
