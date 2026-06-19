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

export const isAgentListingRole = (roleName?: string) => {
  const normalizedRole = String(roleName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  return ["agent", "sales_agent", "sales_manager"].includes(normalizedRole);
};

export const isAgentReviewProperty = (property: any, roleName?: string) => {
  if (isAgentListingRole(roleName)) return true;
  if (isAgentListingRole(property?.postedBy?.roleName)) return true;
  if (isAgentListingRole(property?.lastUpdatedBy?.roleName)) return true;

  const approvalStatus = String(property?.approval?.status ?? "").toLowerCase();
  const completionPercent = Number(property?.completion?.percent);
  const completionStep = Number(property?.completion?.step);

  return (
    approvalStatus === "pending" ||
    completionPercent === 70 ||
    completionStep === 4
  );
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

export async function getCreatedByRoleName(Model: any, createdBy: any) {
  const createdById = toObjectId(createdBy);
  if (!createdById) return undefined;

  const UserModel = Model.db.model("User");
  const RoleModel = Model.db.models?.Role;

  const resolveUserRole = async (userId: any) => {
    const user = await UserModel.findById(userId)
    .select("role roleName roleId")
    .lean();

    if (!user) return undefined;
    if (typeof user.roleName === "string") return user.roleName;
    if (typeof user.role === "string") return user.role;

    if (user.roleId && RoleModel) {
      const role = await RoleModel.findById(user.roleId).select("name").lean();
      return role?.name;
    }

    return undefined;
  };

  const directRoleName = await resolveUserRole(createdById);
  if (directRoleName) return directRoleName;

  const agentProfile = await Model.db.collection("agents").findOne(
    { _id: createdById },
    { projection: { user: 1 } },
  );
  if (agentProfile?.user) {
    const agentRoleName = await resolveUserRole(agentProfile.user);
    if (agentRoleName) return agentRoleName;
  }

  const builderUser = await UserModel.findOne({ builderId: createdById })
    .select("_id")
    .lean();
  if (builderUser?._id) {
    return resolveUserRole(builderUser._id);
  }

  return undefined;
}

function formatCreatedBy(user: any) {
  if (!user) return null;

  return {
    _id: user._id?.toString?.() ?? user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleId: user.roleId,
  };
}

function getRoleNameFromUser(user: any) {
  return (
    user?.roleName ??
    user?.role ??
    user?.roleId?.name ??
    user?.roleId?.label
  );
}

function flattenAuditUser(entry: any) {
  if (!entry?.userId || typeof entry.userId !== "object") {
    return entry;
  }

  const user = entry.userId;
  return {
    ...entry,
    userId: user._id?.toString?.() ?? user._id,
    name: entry.name ?? user.name,
    email: entry.email ?? user.email,
    roleName: entry.roleName ?? getRoleNameFromUser(user),
  };
}

export function normalizeListingAuditFields<T extends Record<string, any> | null>(doc: T) {
  if (!doc) return doc;

  if (doc.postedBy) {
    doc.postedBy = flattenAuditUser(doc.postedBy);
  }
  if (doc.lastUpdatedBy) {
    doc.lastUpdatedBy = flattenAuditUser(doc.lastUpdatedBy);
  }
  if (Array.isArray(doc.updateHistory)) {
    doc.updateHistory = doc.updateHistory.map(flattenAuditUser);
  }

  return doc;
}

async function resolveCreatedBy(Model: any, createdBy: any) {
  const createdById = toObjectId(createdBy);
  if (!createdById) return null;

  const UserModel = Model.db.model("User");

  const directUser = await UserModel.findById(createdById)
    .select("name email phone role roleId")
    .populate("roleId", "name label")
    .lean();
  if (directUser) return formatCreatedBy(directUser);

  const agentProfile = await Model.db.collection("agents").findOne(
    { _id: createdById },
    { projection: { user: 1, name: 1 } },
  );
  if (agentProfile?.user) {
    const agentUser = await UserModel.findById(agentProfile.user)
      .select("name email phone role roleId")
      .populate("roleId", "name label")
      .lean();
    if (agentUser) return formatCreatedBy(agentUser);
  }

  const builderUser = await UserModel.findOne({ builderId: createdById })
    .select("name email phone role roleId")
    .populate("roleId", "name label")
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
  if (doc.createdBy || !originalCreatedBy) {
    return normalizeListingAuditFields(doc);
  }
  doc.createdBy =
    (await resolveCreatedBy(Model, originalCreatedBy)) ??
    (originalCreatedBy?._id?.toString?.() ??
      originalCreatedBy.toString?.() ??
      originalCreatedBy);
  return normalizeListingAuditFields(doc);
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

export async function buildUpdatedByAudit(Model: any, authUser?: AuthUserLike) {
  const userId = authUser?.id ?? authUser?.sub;
  if (!userId) return null;

  const fallbackAudit = {
    userId,
    name: authUser?.name,
    email: authUser?.email,
    roleName: authUser?.roleName,
    updatedAt: new Date(),
  };

  const UserModel = Model.db.model("User");
  const RoleModel = Model.db.models?.Role;
  const user = await UserModel.findById(userId)
    .select("name email role roleName roleId")
    .lean();

  if (!user) return fallbackAudit;

  let roleName =
    typeof user.roleName === "string"
      ? user.roleName
      : typeof user.role === "string"
        ? user.role
        : authUser?.roleName;

  if (!roleName && user.roleId && RoleModel) {
    const role = await RoleModel.findById(user.roleId).select("name").lean();
    roleName = role?.name;
  }

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    roleName,
    updatedAt: new Date(),
  };
}

export async function stampListingUpdateAudit(Model: any, property: any, authUser?: AuthUserLike) {
  const audit = await buildUpdatedByAudit(Model, authUser);
  if (!audit || !property) return;

  property.lastUpdatedBy = audit;
  property.updateHistory = [...(property.updateHistory || []), audit];
  property.updateCount = Number(property.updateCount || 0) + 1;
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
  await stampListingUpdateAudit(Model, property, authUser);

  await property.save();

  const submitted = await Model.findById(id)
    .populate("createdBy", "name email phone role roleId")
    .populate("createdBy.roleId", "name label")
    .populate("lastUpdatedBy.userId", "name email phone role roleId")
    .populate("updateHistory.userId", "name email phone role roleId")
    .lean();
  return restoreCreatedById(Model, submitted, assignedCreatedBy);
}
