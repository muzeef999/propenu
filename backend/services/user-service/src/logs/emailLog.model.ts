import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    to: String,
    subject: String,
      html: String, // 🔥 ADD THIS
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    error: String,

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
    },

    campaignId: String, // 🔥 future use

  },
  { timestamps: true }
);

export const EmailLog = mongoose.model("EmailLog", emailLogSchema);