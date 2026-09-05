import { Types } from "mongoose";
import { sendBulkPush } from "../../../../shared/notifications/push.service";
import FeaturedProject from "../models/featurePropertiesModel";
import Role from "../models/roleModel";
import User from "../models/userModel";

type NotifyInput = {
  type: string;
  title: string;
  body: string;
  actorUserId?: string | undefined;
  ownerId?: string | Types.ObjectId | null | undefined;
  projectId?: string | Types.ObjectId | null | undefined;
  propertyType?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};

const ADMIN_ROLE_NAMES = ["admin", "super_admin"];

const stringifyData = (data: Record<string, unknown> = {}) =>
  Object.entries(data).reduce<Record<string, string>>((result, [key, value]) => {
    if (value === undefined || value === null) return result;
    result[key] = String(value);
    return result;
  }, {});

const sendToTokens = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
) => {
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (!uniqueTokens.length) return;

  await sendBulkPush({
    tokens: uniqueTokens,
    title,
    body,
    data: stringifyData(data),
  });
};

const getAdminUsersWithTokens = async () => {
  const roles = await Role.find({ name: { $in: ADMIN_ROLE_NAMES } })
    .select("_id")
    .lean();
  const roleIds = roles.map((role) => role._id);

  if (!roleIds.length) return [];

  return User.find({
    roleId: { $in: roleIds },
    fcmToken: { $nin: [null, ""] },
    isActive: { $ne: false },
  })
    .select("_id fcmToken")
    .lean();
};

export const createPlatformNotification = async ({
  type,
  title,
  body,
  actorUserId,
  ownerId,
  projectId,
  propertyType,
  metadata = {},
}: NotifyInput) => {
  const adminUsers = await getAdminUsersWithTokens();
  const now = new Date();

  await User.db.collection("platformnotifications").insertOne({
    audience: "admin",
    type,
    title,
    body,
    actorUserId: actorUserId && Types.ObjectId.isValid(actorUserId)
      ? new Types.ObjectId(actorUserId)
      : null,
    ownerId: ownerId && Types.ObjectId.isValid(String(ownerId))
      ? new Types.ObjectId(String(ownerId))
      : null,
    projectId: projectId && Types.ObjectId.isValid(String(projectId))
      ? new Types.ObjectId(String(projectId))
      : null,
    propertyType: propertyType || null,
    recipientUserIds: adminUsers.map((user) => user._id),
    metadata,
    createdAt: now,
    updatedAt: now,
  });

  await sendToTokens(
    adminUsers.map((user) => String(user.fcmToken || "")),
    title,
    body,
    { type, audience: "admin", projectId: projectId ? String(projectId) : "" },
  );
};

export const notifyOwnerAndAdmins = async ({
  type,
  title,
  body,
  actorUserId,
  ownerId,
  projectId,
  propertyType,
  metadata,
}: NotifyInput) => {
  try {
    const owner =
      ownerId && Types.ObjectId.isValid(String(ownerId))
        ? await User.findById(ownerId).select("fcmToken").lean()
        : null;

    await Promise.all([
      owner?.fcmToken
        ? sendToTokens([String(owner.fcmToken)], title, body, {
            type,
            audience: "owner",
            projectId: projectId ? String(projectId) : "",
          })
        : Promise.resolve(),
      createPlatformNotification({
        type,
        title,
        body,
        actorUserId,
        ownerId,
        projectId,
        propertyType,
        metadata,
      }),
    ]);
  } catch (error) {
    console.error("Notification delivery failed:", error);
  }
};

export const notifyProjectBrochureDownload = async ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  const [project, user] = await Promise.all([
    FeaturedProject.findById(projectId)
      .select("title projectName createdBy")
      .lean(),
    User.findById(userId).select("name phone email").lean(),
  ]);

  if (!project) return;

  const projectTitle =
    project.title || (project as any).projectName || "your project";
  const userName = user?.name || "A user";

  if (!project.createdBy) return;

  await notifyOwnerAndAdmins({
    type: "brochure_downloaded",
    title: "Brochure Downloaded",
    body: `${userName} downloaded the brochure for ${projectTitle}.`,
    actorUserId: userId,
    ownerId: project.createdBy,
    projectId,
    propertyType: "featuredprojects",
    metadata: {
      projectTitle,
      userName,
      userPhone: user?.phone || "",
      userEmail: user?.email || "",
    },
  });
};
