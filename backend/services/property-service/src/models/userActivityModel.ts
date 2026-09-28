import mongoose, { Document, Model, Schema, Types } from "mongoose";

/** Cap embedded actions so one user document stays well under Mongo's 16MB limit. */
export const USER_ACTIVITY_MAX_ACTIONS = 400;
export const USER_ACTIVITY_PAGE_SIZE = 12;

export interface IUserActivityAction {
  _id: Types.ObjectId;
  sessionId: string;
  eventType: string;
  eventCategory: string;
  entityType?: string;
  projectId?: Types.ObjectId;
  propertyId?: Types.ObjectId;
  plotId?: Types.ObjectId;
  promotionType?: string;
  promotionId?: Types.ObjectId;
  source?: string;
  pageUrl?: string;
  previousPageUrl?: string;
  metadata?: Record<string, unknown>;
  searchContext?: Record<string, unknown>;
  clientTimestamp?: Date;
  serverTimestamp: Date;
}

export interface IUserActivityDocument extends Document {
  userId: Types.ObjectId;
  eventCount: number;
  lastEventAt: Date;
  lastEventType?: string;
  lastPageUrl?: string;
  lastSessionId?: string;
  lastAction?: IUserActivityAction;
  counters: Record<string, number>;
  daily: Record<string, Record<string, number>>;
  actions: IUserActivityAction[];
  createdAt: Date;
  updatedAt: Date;
}

const ActionSubSchema = new Schema(
  {
    sessionId: { type: String, required: true, trim: true, maxlength: 128 },
    eventType: { type: String, required: true, trim: true, maxlength: 80 },
    eventCategory: { type: String, required: true, trim: true, maxlength: 80 },
    entityType: { type: String, trim: true, maxlength: 32 },
    projectId: { type: Schema.Types.ObjectId },
    propertyId: { type: Schema.Types.ObjectId },
    plotId: { type: Schema.Types.ObjectId },
    promotionType: { type: String, trim: true, maxlength: 32 },
    promotionId: { type: Schema.Types.ObjectId },
    source: { type: String, trim: true, maxlength: 120 },
    pageUrl: { type: String, trim: true, maxlength: 2048 },
    previousPageUrl: { type: String, trim: true, maxlength: 2048 },
    metadata: { type: Schema.Types.Mixed },
    searchContext: { type: Schema.Types.Mixed },
    clientTimestamp: { type: Date },
    serverTimestamp: { type: Date, required: true },
  },
  { _id: true, minimize: true },
);

const UserActivitySchema = new Schema<IUserActivityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    eventCount: { type: Number, default: 0, min: 0 },
    lastEventAt: { type: Date, index: true },
    lastEventType: { type: String, trim: true, maxlength: 80 },
    lastPageUrl: { type: String, trim: true, maxlength: 2048 },
    lastSessionId: { type: String, trim: true, maxlength: 128 },
    lastAction: { type: Schema.Types.Mixed },
    counters: { type: Schema.Types.Mixed, default: {} },
    daily: { type: Schema.Types.Mixed, default: {} },
    actions: { type: [ActionSubSchema], default: [] },
  },
  { timestamps: true, minimize: true },
);

UserActivitySchema.index({ lastEventAt: -1 });

const UserActivity: Model<IUserActivityDocument> =
  (mongoose.models.UserActivity as Model<IUserActivityDocument>) ||
  mongoose.model<IUserActivityDocument>("UserActivity", UserActivitySchema);

export default UserActivity;
