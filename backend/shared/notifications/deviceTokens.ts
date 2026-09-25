import mongoose, { Schema, Document, Types } from "mongoose";

export type DevicePlatform = "android" | "ios" | "web" | "unknown";

export interface IDeviceToken extends Document {
  userId: Types.ObjectId;
  token: string;
  platform: DevicePlatform;
  deviceId?: string | null;
  lastSeenAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web", "unknown"],
      default: "unknown",
    },
    deviceId: {
      type: String,
      default: null,
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "devicetokens",
  },
);

DeviceTokenSchema.index({ userId: 1, isActive: 1 });
DeviceTokenSchema.index({ userId: 1, deviceId: 1 });

export const DeviceToken =
  (mongoose.models.DeviceToken as mongoose.Model<IDeviceToken>) ||
  mongoose.model<IDeviceToken>("DeviceToken", DeviceTokenSchema, "devicetokens");

export const normalizeDevicePlatform = (value?: unknown): DevicePlatform => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "android" || normalized === "ios" || normalized === "web") {
    return normalized;
  }
  return "unknown";
};

const toObjectIds = (userIds: Array<string | Types.ObjectId>) =>
  Array.from(new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)))
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

export const getActiveDeviceTokensForUsers = async (
  userIds: Array<string | Types.ObjectId>,
): Promise<string[]> => {
  const objectIds = toObjectIds(userIds);
  if (!objectIds.length) return [];

  const db = mongoose.connection.db;
  if (!db) return [];

  const [deviceRows, legacyUsers] = await Promise.all([
    db
      .collection("devicetokens")
      .find({
        userId: { $in: objectIds },
        token: { $nin: [null, ""] },
        isActive: { $ne: false },
      })
      .project({ token: 1 })
      .toArray(),
    db
      .collection("users")
      .find({
        _id: { $in: objectIds },
        fcmToken: { $nin: [null, ""] },
        isActive: { $ne: false },
      })
      .project({ fcmToken: 1 })
      .toArray(),
  ]);

  return Array.from(
    new Set([
      ...deviceRows.map((row) => String(row.token || "")),
      ...legacyUsers.map((user) => String(user.fcmToken || "")),
    ].filter(Boolean)),
  );
};

export const upsertDeviceToken = async ({
  userId,
  token,
  platform,
  deviceId,
}: {
  userId: string | Types.ObjectId;
  token: string;
  platform?: unknown;
  deviceId?: unknown;
}) => {
  if (!Types.ObjectId.isValid(String(userId))) {
    throw new Error("Invalid userId");
  }

  const trimmedToken = String(token || "").trim();
  if (!trimmedToken) {
    throw new Error("Token is required");
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database is not connected");
  }

  const userObjectId = new Types.ObjectId(String(userId));
  const normalizedPlatform = normalizeDevicePlatform(platform);
  const normalizedDeviceId = String(deviceId || "").trim() || null;
  const now = new Date();
  const collection = db.collection("devicetokens");

  if (normalizedDeviceId) {
    await collection.updateMany(
      {
        userId: userObjectId,
        deviceId: normalizedDeviceId,
        token: { $ne: trimmedToken },
      },
      {
        $set: {
          isActive: false,
          updatedAt: now,
        },
      },
    );
  }

  await collection.updateOne(
    { token: trimmedToken },
    {
      $set: {
        userId: userObjectId,
        token: trimmedToken,
        platform: normalizedPlatform,
        deviceId: normalizedDeviceId,
        isActive: true,
        lastSeenAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return {
    userId: String(userObjectId),
    token: trimmedToken,
    platform: normalizedPlatform,
    deviceId: normalizedDeviceId,
  };
};

export const deactivateDeviceTokens = async (tokens: string[]) => {
  const validTokens = Array.from(new Set(tokens.map((t) => String(t || "").trim()).filter(Boolean)));
  if (!validTokens.length) return;

  const db = mongoose.connection.db;
  if (!db) return;

  await db.collection("devicetokens").updateMany(
    { token: { $in: validTokens } },
    {
      $set: {
        isActive: false,
        updatedAt: new Date(),
      },
    },
  );
};
