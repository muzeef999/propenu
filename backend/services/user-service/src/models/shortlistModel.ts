import mongoose, { Schema, Types, Document } from "mongoose";

export interface IShortlist extends Document {
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  propertyType:string
  createdAt: Date;
  updatedAt: Date;
}

const ShortlistSchema = new Schema<IShortlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    propertyId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    propertyType: {
      type: String,
      enum: ["Residential", "Commercial", "Land", "Agricultural"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// 🚀 Prevent duplicate shortlist per user
ShortlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const Shortlist =
  mongoose.models.Shortlist ||
  mongoose.model<IShortlist>("Shortlist", ShortlistSchema);

export default Shortlist;
