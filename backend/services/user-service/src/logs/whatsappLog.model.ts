import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    to: String,
    templateName: String,

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    error: String,

    recordId: String,
    campaignId: String,
  },
  { timestamps: true }
);

export const WhatsAppLog = mongoose.model(
  "WhatsAppLog",
  schema
);