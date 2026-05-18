import mongoose, { Schema } from "mongoose";
import { Agent } from "../types/agent";

// ================= SCHEMA =================

const AgentSchema = new Schema<Agent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    avatar: {
      url: String,
      key: String,
    },

    coverImage: {
      url: String,
      key: String,
    },

    bio: String,
    agencyName: String,
    licenseNumber: String,
    licenseValidTill: Date,

    areasServed: [String],

    locality: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
      lowercase: true,
    },

    experienceYears: Number,
    dealsClosed: Number,

    languages: [{ type: String }],

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    verificationDocuments: [
      {
        type: { type: String },
        url: String,
        providerResponse: Schema.Types.Mixed,
        status: String,
      },
    ],

    rera: {
      reraAgentId: String,
      providerResponse: Schema.Types.Mixed,
      isVerified: Boolean,
    },

    stats: {
      totalProperties: { type: Number, default: 0 },
      publishedCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ================= SLUG GENERATION =================

AgentSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  next();
});

// ================= SAFE UNIQUE CHECK =================

AgentSchema.pre("save", async function (next) {
  if (!this.slug) return next();

  const existing = await (this.constructor as any).findOne({
    slug: this.slug,
    _id: { $ne: this._id },
  });

  if (existing) {
    return next(new Error("Slug already exists"));
  }

  next();
});

// ================= MODEL =================

const AgentModel = mongoose.model<Agent>("Agent", AgentSchema);

export default AgentModel;
