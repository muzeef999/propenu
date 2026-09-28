import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IHighTimeSpentNotification extends Document {
  ownerId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  propertyType?: string | null;
  sentAt: Date;
  createdAt: Date;
}

const HighTimeSpentNotificationSchema = new Schema<IHighTimeSpentNotification>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    propertyType: {
      type: String,
      default: null,
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "hightimespentnotifications",
  },
);

HighTimeSpentNotificationSchema.index({ userId: 1, projectId: 1, sentAt: -1 });

export const HighTimeSpentNotification: Model<IHighTimeSpentNotification> =
  (mongoose.models.HighTimeSpentNotification as Model<IHighTimeSpentNotification>) ||
  mongoose.model<IHighTimeSpentNotification>(
    "HighTimeSpentNotification",
    HighTimeSpentNotificationSchema,
    "hightimespentnotifications",
  );

export default HighTimeSpentNotification;
