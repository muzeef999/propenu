import mongoose from "mongoose";
import BuilderMember from "../models/builderMemberModel";
import BuilderRole from "../models/builderRoleModel";

export type BuilderAccess = {
  builderId: string;
  memberId: string | null;
  roleId: string | null;
  roleName: string;
  permissions: string[];
  projectIds: string[];
  isOwner: boolean;
};

export const getBuilderAccessForUser = async (user: {
  _id?: unknown;
  id?: unknown;
  roleName?: string | null;
}) => {
  const userId = String(user._id || user.id || "");
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

  if (user.roleName === "builder") {
    return {
      builderId: userId,
      memberId: null,
      roleId: null,
      roleName: "Owner",
      permissions: ["*"],
      projectIds: ["*"],
      isOwner: true,
    } satisfies BuilderAccess;
  }

  const member = await BuilderMember.findOne({
    userId,
    isActive: true,
  })
    .populate("builderRoleId")
    .lean();

  if (!member) return null;

  const role = member.builderRoleId as any;
  if (!role || role.isActive === false) return null;

  return {
    builderId: String(member.builderId),
    memberId: String(member._id),
    roleId: String(role._id),
    roleName: role.name,
    permissions: role.permissions ?? [],
    projectIds: (member.projectIds ?? []).map(String),
    isOwner: false,
  } satisfies BuilderAccess;
};

export const getBuilderRoleByIdForBuilder = async (
  builderId: string,
  roleId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) return null;
  return BuilderRole.findOne({ _id: roleId, builderId, isActive: true });
};
