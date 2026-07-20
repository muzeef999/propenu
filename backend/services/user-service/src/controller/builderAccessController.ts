import { Request, Response } from "express";
import mongoose from "mongoose";
import BuilderRole from "../models/builderRoleModel";
import BuilderMember from "../models/builderMemberModel";
import User from "../models/userModel";
import Role from "../models/roleModel";
import {
  BUILDER_PERMISSION_KEYS,
  BUILDER_PERMISSION_SET,
  BUILDER_STAFF_ROLE_NAME,
} from "../constants/builderPermissions";
import { AuthRequest } from "../middlewares/authMiddleware";

const getBuilderId = (req: AuthRequest) => {
  if (req.user?.roleName !== "builder") return null;
  return req.user.sub;
};

const validatePermissions = (permissions: unknown) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.map(String))].filter((permission) =>
    BUILDER_PERMISSION_SET.has(permission),
  );
};

const validateProjectIds = (projectIds: unknown) => {
  if (!Array.isArray(projectIds)) return [];
  return [...new Set(projectIds.map(String))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
};

export const getBuilderPermissionCatalog = (_req: Request, res: Response) => {
  res.json({ success: true, permissions: BUILDER_PERMISSION_KEYS });
};

export const createBuilderRole = async (req: AuthRequest, res: Response) => {
  try {
    const builderId = getBuilderId(req);
    if (!builderId) {
      return res.status(403).json({ message: "Only builders can create roles" });
    }

    const name = String(req.body.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await BuilderRole.create({
      builderId,
      name,
      permissions: validatePermissions(req.body.permissions),
      createdBy: builderId,
    });

    res.status(201).json({ success: true, role });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Role name already exists" });
    }
    res.status(500).json({ message: "Failed to create builder role" });
  }
};

export const getBuilderRoles = async (req: AuthRequest, res: Response) => {
  const builderId = getBuilderId(req);
  if (!builderId) {
    return res.status(403).json({ message: "Only builders can view roles" });
  }

  const roles = await BuilderRole.find({ builderId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, roles });
};

export const updateBuilderRole = async (req: AuthRequest, res: Response) => {
  const builderId = getBuilderId(req);
  const roleId = req.params.id;

  if (!builderId) {
    return res.status(403).json({ message: "Only builders can update roles" });
  }

  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
    return res.status(400).json({ message: "Invalid role id" });
  }

  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body.permissions !== undefined) {
    updates.permissions = validatePermissions(req.body.permissions);
  }
  if (req.body.isActive !== undefined) {
    updates.isActive = Boolean(req.body.isActive);
  }

  const role = await BuilderRole.findOneAndUpdate(
    { _id: roleId, builderId },
    updates,
    { new: true },
  );

  if (!role) {
    return res.status(404).json({ message: "Builder role not found" });
  }

  res.json({ success: true, role });
};

export const createBuilderMember = async (req: AuthRequest, res: Response) => {
  try {
    const builderId = getBuilderId(req);
    if (!builderId) {
      return res.status(403).json({ message: "Only builders can create team members" });
    }

    const name = String(req.body.name ?? "").trim();
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;
    const phone = req.body.phone ? String(req.body.phone).trim() : undefined;
    const builderRoleId = String(req.body.builderRoleId ?? "");

    if (!name || (!email && !phone)) {
      return res.status(400).json({ message: "Name and email or phone are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(builderRoleId)) {
      return res.status(400).json({ message: "Valid builderRoleId is required" });
    }

    const builderRole = await BuilderRole.findOne({
      _id: builderRoleId,
      builderId,
      isActive: true,
    });
    if (!builderRole) {
      return res.status(400).json({ message: "Builder role not found" });
    }

    const staffRole = await Role.findOne({ name: BUILDER_STAFF_ROLE_NAME });
    if (!staffRole) {
      return res.status(400).json({
        message: "Global builder_staff role is missing. Run seed roles first.",
      });
    }

    const existingPhoneUser = phone
      ? await User.findOne({ phone }).select("_id name email phone roleId builderId")
      : null;
    const existingEmailUser = email
      ? await User.findOne({ email }).select("_id name email phone roleId builderId")
      : null;

    if (
      existingPhoneUser &&
      existingEmailUser &&
      String(existingPhoneUser._id) !== String(existingEmailUser._id)
    ) {
      return res.status(409).json({
        message: "Email and phone number belong to different accounts",
      });
    }

    if (existingPhoneUser && (!email || existingPhoneUser.email !== email)) {
      return res.status(409).json({
        message: "Phone number already exists",
      });
    }

    if (existingEmailUser && phone && existingEmailUser.phone && existingEmailUser.phone !== phone) {
      return res.status(409).json({
        message: "Email is already linked to a different phone number",
      });
    }

    let user = existingEmailUser ?? existingPhoneUser ?? null;

    if (user) {
      const userRoleId =
        user.roleId instanceof mongoose.Types.ObjectId
          ? user.roleId
          : user.roleId
            ? new mongoose.Types.ObjectId(String(user.roleId))
            : null;
      const userBuilderId =
        user.builderId instanceof mongoose.Types.ObjectId
          ? user.builderId
          : user.builderId
            ? new mongoose.Types.ObjectId(String(user.builderId))
            : null;
      const isExistingBuilderStaff =
        !!userRoleId && String(userRoleId) === String(staffRole._id);
      const belongsToSameBuilder =
        !!userBuilderId && String(userBuilderId) === String(builderId);

      if (!isExistingBuilderStaff) {
        return res.status(409).json({
          message:
            "This email or phone number is already registered with another account role",
        });
      }

      if (!belongsToSameBuilder) {
        return res.status(409).json({
          message:
            "This builder staff account is already assigned under another builder account",
        });
      }

      const existingMembership = await BuilderMember.findOne({
        userId: user._id,
        builderId: { $ne: new mongoose.Types.ObjectId(builderId) },
      })
        .select("_id builderId")
        .lean();

      if (existingMembership) {
        return res.status(409).json({
          message:
            "This email or phone number is already assigned under another builder account",
        });
      }
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        phone,
        roleId: staffRole._id,
        builderId,
        accountStatus: "active",
        phoneVerified: Boolean(phone),
        kyc: { status: "not_started" },
      });
    } else {
      user.name = name;
      user.roleId = staffRole._id;
      user.builderId = new mongoose.Types.ObjectId(builderId);
      user.isActive = true;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (user.accountStatus !== "active") user.accountStatus = "active";
      await user.save();
    }

    const member = await BuilderMember.findOneAndUpdate(
      { builderId, userId: user._id },
      {
        builderId,
        userId: user._id,
        builderRoleId,
        projectIds: validateProjectIds(req.body.projectIds),
        isActive: true,
        createdBy: builderId,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("userId", "name email phone roleName")
      .populate("builderRoleId", "name permissions")
      .lean();

    res.status(201).json({ success: true, member });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create builder member",
      error: error.message,
    });
  }
};

export const getBuilderMembers = async (req: AuthRequest, res: Response) => {
  const builderId = getBuilderId(req);
  if (!builderId) {
    return res.status(403).json({ message: "Only builders can view team members" });
  }

  const members = await BuilderMember.find({ builderId })
    .populate("userId", "name email phone roleName")
    .populate("builderRoleId", "name permissions isActive")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, members });
};

export const updateBuilderMember = async (req: AuthRequest, res: Response) => {
  const builderId = getBuilderId(req);
  const memberId = req.params.id;

  if (!builderId) {
    return res.status(403).json({ message: "Only builders can update team members" });
  }

  if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: "Invalid member id" });
  }

  const updates: Record<string, unknown> = {};
  if (req.body.builderRoleId !== undefined) {
    const roleId = String(req.body.builderRoleId);
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: "Invalid builderRoleId" });
    }
    const role = await BuilderRole.exists({ _id: roleId, builderId });
    if (!role) return res.status(400).json({ message: "Builder role not found" });
    updates.builderRoleId = roleId;
  }
  if (req.body.projectIds !== undefined) {
    updates.projectIds = validateProjectIds(req.body.projectIds);
  }
  if (req.body.isActive !== undefined) {
    updates.isActive = Boolean(req.body.isActive);
  }

  const member = await BuilderMember.findOneAndUpdate(
    { _id: memberId, builderId },
    updates,
    { new: true },
  )
    .populate("userId", "name email phone roleName")
    .populate("builderRoleId", "name permissions isActive");

  if (!member) {
    return res.status(404).json({ message: "Builder member not found" });
  }

  res.json({ success: true, member });
};
