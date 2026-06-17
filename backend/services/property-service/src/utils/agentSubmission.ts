import mongoose from "mongoose";

export const isDirectAgentRole = (roleName?: string) => {
  const normalizedRole = String(roleName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  return [
    "agent",
    "sales_agent",
    "sales_manager",
    "admin",
    "super_admin",
    "customer_care"
  ].includes(normalizedRole);
};

type AuthUserLike = {
  id?: string | undefined;
  sub?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | number | undefined;
  roleName?: string | undefined;
};

function toObjectId(value: any) {
  const rawId = value?._id ?? value;
  const id = rawId?.toString?.() ?? rawId;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function formatCreatedBy(user: any) {
  if (!user) return null;

  return {
    _id: user._id?.toString?.() ?? user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}

async function resolveCreatedBy(Model: any, createdBy: any) {
  const createdById = toObjectId(createdBy);
  if (!createdById) return null;

  const UserModel = Model.db.model("User");

  const directUser = await UserModel.findById(createdById)
    .select("name email phone")
    .lean();
  if (directUser) return formatCreatedBy(directUser);

  const agentProfile = await Model.db.collection("agents").findOne(
    { _id: createdById },
    { projection: { user: 1, name: 1 } },
  );
  if (agentProfile?.user) {
    const agentUser = await UserModel.findById(agentProfile.user)
      .select("name email phone")
      .lean();
    if (agentUser) return formatCreatedBy(agentUser);
  }

  const builderUser = await UserModel.findOne({ builderId: createdById })
    .select("name email phone")
    .lean();
  if (builderUser) return formatCreatedBy(builderUser);

  return null;
}

export async function restoreCreatedById<
  T extends { createdBy?: any; rejectedReason?: string },
>(
  Model: any,
  doc: T | null,
  originalCreatedBy: any,
) {
  if (!doc) return doc;
  doc.rejectedReason ??= "";
  if (doc.createdBy || !originalCreatedBy) return doc;
  doc.createdBy =
    (await resolveCreatedBy(Model, originalCreatedBy)) ??
    (originalCreatedBy?._id?.toString?.() ??
      originalCreatedBy.toString?.() ??
      originalCreatedBy);
  return doc;
}

function buildAuditFromAuthUser(authUser?: AuthUserLike, existingPostedBy?: any) {
  const userId = authUser?.id ?? authUser?.sub;
  if (!userId) return existingPostedBy;

  return {
    userId,
    name: authUser?.name,
    email: authUser?.email,
    roleName: authUser?.roleName,
    postedAt: existingPostedBy?.userId
      ? (existingPostedBy.postedAt ?? new Date())
      : new Date(),
  };
}

export async function buildPostedByAudit(
  Model: any,
  createdBy: any,
  existingPostedBy: any,
  authUser?: AuthUserLike,
) {
  const posterAudit = buildAuditFromAuthUser(authUser, existingPostedBy);
  if (posterAudit?.userId) return posterAudit;

  if (!createdBy) return existingPostedBy;

  const userId = createdBy?._id ?? createdBy;
  const UserModel = Model.db.model("User");
  const RoleModel = Model.db.models?.Role;

  const user = await UserModel.findById(userId)
    .select("name email role roleName roleId")
    .lean();

  if (!user) return buildAuditFromAuthUser(authUser, existingPostedBy);

  let roleName =
    typeof user.roleName === "string"
      ? user.roleName
      : typeof user.role === "string"
        ? user.role
        : undefined;

  if (!roleName && user.roleId && RoleModel) {
    const role = await RoleModel.findById(user.roleId).select("name").lean();
    roleName = role?.name;
  }

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    roleName,
    postedAt: existingPostedBy?.userId
      ? (existingPostedBy.postedAt ?? new Date())
      : new Date(),
  };
}

export async function submitAgentListingForReview(
  Model: any,
  id: string,
  authUser?: AuthUserLike,
) {
  const property = await Model.findById(id);
  if (!property) return null;
  const assignedCreatedBy = property.createdBy?.toString?.() ?? property.createdBy;

  property.status = "pending";
  property.isPublished = false;
  property.completion = {
    ...(property.completion?.toObject?.() ?? property.completion ?? {}),
    percent: 70,
    step: 4,
    lastSection: "details",
  };
  property.approval ??= {};
  property.approval.status = "pending";
  property.postedBy = await buildPostedByAudit(
    Model,
    property.createdBy,
    property.postedBy,
    authUser,
  );

  await property.save();

  const submitted = await Model.findById(id)
    .populate("createdBy", "name email phone")
    .lean();
  return restoreCreatedById(Model, submitted, assignedCreatedBy);
}
