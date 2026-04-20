import mongoose from "mongoose";

const schema = new mongoose.Schema(

  {
    to: { type: String, required: true },
    templateName: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },

    error: String,

    response: mongoose.Schema.Types.Mixed, // 🔥 store meta response

    recordId: String,
    campaignId: { type: String, index: true },

  },
  { timestamps: true }
);

export const WhatsAppLog = mongoose.model("WhatsAppLog", schema);