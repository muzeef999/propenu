import mongoose, { Document, Model } from "mongoose";

const { Schema } = mongoose;

export interface ISiteLogo extends Document {
  logoUrl: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteLogoSchema = new Schema<ISiteLogo>(
  {
    logoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

/** Singleton collection — at most one document in practice. */
export const SiteLogo: Model<ISiteLogo> =
  mongoose.models.SiteLogo ||
  mongoose.model<ISiteLogo>("SiteLogo", siteLogoSchema);
