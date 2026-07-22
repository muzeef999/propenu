import { Response } from "express";
import Role from "../models/roleModel";
import User from "../models/userModel";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ALL_PERMISSIONS, PERMISSION_CATALOG, PERMISSION_SET } from "../constants/permissionCatalog";
import { BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES, OPERATIONS_MANAGED_ROLE_NAMES } from "../utils/roleManagementPolicy";

const PROTECTED_ROLE_NAMES = new Set(["super_admin", "admin"]);

const normalizeRoleName = (name: string) => name.trim().toLowerCase();
const SYSTEM_ROLE_NAMES = new Set(["super_admin", "admin", "user", "builder", "builder_staff", "agent"]);

const normalizePermissions = (permissions: unknown[]) =>
  [...new Set(permissions.map((permission) => String(permission).trim().toLowerCase()))];

const getInvalidPermissions = (permissions: string[]) =>
  permissions.filter((permission) => !PERMISSION_SET.has(permission));

export const getPermissionCatalog = async (_req: AuthRequest, res: Response) =>
  res.json({
    success: true,
    moduleCount: PERMISSION_CATALOG.length,
    permissionCount: ALL_PERMISSIONS.length,
    modules: PERMISSION_CATALOG,
  });

export const getAssignableRoles = async (req: AuthRequest, res: Response) => {
  try {
    const roleFilter: any = {
      isActive: { $ne: false },
      name: { $nin: ["super_admin", "user", "builder", "builder_staff", "agent"] },
    };

    if (["operations_head", "operation_head"].includes(req.user?.roleName || "")) {
      roleFilter.name = { $in: [...OPERATIONS_MANAGED_ROLE_NAMES] };
    } else if (req.user?.roleName === "business_development_head") {
      roleFilter.name = { $in: [...BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES] };
    }

    const roles = await Role.find(roleFilter)
      .select("name label permissions roleType isProtected parentRoleId")
      .populate("parentRoleId", "name label")
      .sort({ label: 1 })
      .lean();
    return res.json({ success: true, roles });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch assignable roles", error: err.message });
  }
};

export const getTeamDirectoryRoles = async (req: AuthRequest, res: Response) => {
  try {
    const excluded = ["super_admin", "user", "builder", "builder_staff", "agent"];
    if (req.user?.roleName) excluded.push(req.user.roleName);

    const roleFilter: any = {
      isActive: { $ne: false },
      name: { $nin: excluded },
    };

    if (["operations_head", "operation_head"].includes(req.user?.roleName || "")) {
      roleFilter.name = { $in: [...OPERATIONS_MANAGED_ROLE_NAMES].filter((name) => !excluded.includes(name)) };
    } else if (req.user?.roleName === "business_development_head") {
      roleFilter.name = { $in: [...BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES].filter((name) => !excluded.includes(name)) };
    }

    const roles = await Role.find(roleFilter)
      .select("name label parentRoleId")
      .populate("parentRoleId", "name label")
      .sort({ label: 1 })
      .lean();

    return res.json({ success: true, roles });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to fetch team directory roles", error: err.message });
  }
};

const isRegionalManager = (req: AuthRequest) =>
  req.user?.roleName === "regional_manager";

const isOperationsHead = (req: AuthRequest) =>
  ["operations_head", "operation_head"].includes(req.user?.roleName || "");

const rejectRoleOutsideManagementScope = (
  req: AuthRequest,
  res: Response,
  roleName?: string | null,
) => {
  if (isOperationsHead(req) && (!roleName || !OPERATIONS_MANAGED_ROLE_NAMES.has(normalizeRoleName(roleName)))) {
    res.status(403).json({
      message: "You can manage only roles assigned below Operations Head",
    });
    return true;
  }
  return false;
};

const isProtectedRoleName = (name?: string | null) =>
  !!name && PROTECTED_ROLE_NAMES.has(normalizeRoleName(name));

const rejectProtectedRoleForRegionalManager = (
  req: AuthRequest,
  res: Response,
  roleName?: string | null,
) => {
  if (isRegionalManager(req) && isProtectedRoleName(roleName)) {
    res.status(403).json({
      message: "Regional Manager cannot manage Admin or Super Admin roles",
    });
    return true;
  }

  return false;
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, label, permissions, parentRoleId } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        message: "name and label are required",
      });
    }

    const normalizedName = normalizeRoleName(name);
    const normalizedPermissions = normalizePermissions(Array.isArray(permissions) ? permissions : []);

    if (SYSTEM_ROLE_NAMES.has(normalizedName)) {
      return res.status(409).json({ message: "This name is reserved for a system role" });
    }

    const invalidPermissions = getInvalidPermissions(normalizedPermissions);
    if (invalidPermissions.length) {
      return res.status(400).json({ message: "One or more permissions are invalid", invalidPermissions });
    }

    if (rejectProtectedRoleForRegionalManager(req, res, normalizedName)) return;

    let parentRole = null;
    if (parentRoleId) {
      if (!mongoose.Types.ObjectId.isValid(parentRoleId)) {
        return res.status(400).json({ message: "Invalid parent role" });
      }
      parentRole = await Role.findById(parentRoleId).select("_id name label isActive");
      if (!parentRole) {
        return res.status(404).json({ message: "Parent role not found" });
      }
      if (parentRole.isActive === false) {
        return res.status(409).json({ message: "Select an active parent role" });
      }
      if (["user", "builder", "builder_staff", "agent"].includes(parentRole.name)) {
        return res.status(400).json({ message: "System account roles cannot be hierarchy parents" });
      }
    }

    const exists = await Role.findOne({ name: normalizedName });
    if (exists) {
      return res.status(409).json({
        message: `Role '${name}' already exists`,
      });
    }

    const role = await Role.create({
      name: normalizedName,
      label,
      permissions: normalizedPermissions,
      roleType: "custom",
      isProtected: false,
      parentRoleId: parentRole?._id || null,
    });

    return res.status(201).json({
      success: true,
      role,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to create role",
      error: err.message,
    });
  }
};


export const getAllRoles = async (req: AuthRequest, res: Response) => {
  try {
    const filter = isOperationsHead(req)
      ? { name: { $in: [...OPERATIONS_MANAGED_ROLE_NAMES] } }
      : {};
    const roles = await Role.find(filter).populate("parentRoleId", "name label").sort({ createdAt: -1 }).lean();
    const roleIds = roles.map((role) => role._id);
    const assignmentCounts = await User.aggregate([
      { $match: { roleId: { $in: roleIds } } },
      { $group: { _id: "$roleId", count: { $sum: 1 } } },
    ]);
    const countsByRole = new Map(
      assignmentCounts.map((item) => [String(item._id), item.count]),
    );
    const rolesWithUsage = roles.map((role) => ({
      ...role,
      assignedUserCount: countsByRole.get(String(role._id)) || 0,
    }));

    return res.json({
      success: true,
      count: rolesWithUsage.length,
      roles: rolesWithUsage,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to fetch roles",
      error: err.message,
    });
  }
};


export const getRoleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

     if (!id) {
      return res.status(400).json({ message: "Role id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findById(id).populate("parentRoleId", "name label");
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    if (rejectRoleOutsideManagementScope(req, res, role.name)) return;

    return res.json({
      success: true,
      role,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to fetch role",
      error: err.message,
    });
  }
};


export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        message: "permissions must be an array",
      });
    }

    const normalizedPermissions = normalizePermissions(permissions);
    const invalidPermissions = getInvalidPermissions(normalizedPermissions);
    if (invalidPermissions.length) {
      return res.status(400).json({ message: "One or more permissions are invalid", invalidPermissions });
    }

    const existingRole = await Role.findById(id);

    if (!existingRole) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    if (rejectProtectedRoleForRegionalManager(req, res, existingRole.name)) return;
    if (rejectRoleOutsideManagementScope(req, res, existingRole.name)) return;

    const role = await Role.findByIdAndUpdate(
      id,
      { permissions: normalizedPermissions },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    return res.json({
      success: true,
      role,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to update permissions",
      error: err.message,
    });
  }
};

export const updateRoleStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be a boolean",
      });
    }

    const existingRole = await Role.findById(id);

    if (!existingRole) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    if (rejectProtectedRoleForRegionalManager(req, res, existingRole.name)) return;
    if (rejectRoleOutsideManagementScope(req, res, existingRole.name)) return;

    existingRole.isActive = isActive;
    await existingRole.save();

    return res.json({
      success: true,
      role: existingRole,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to update role status",
      error: err.message,
    });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.roleType !== "custom" || role.isProtected || SYSTEM_ROLE_NAMES.has(role.name)) {
      return res.status(403).json({
        message: "System and protected roles cannot be deleted",
      });
    }

    if (role.isActive !== false) {
      return res.status(409).json({
        code: "ROLE_MUST_BE_DEACTIVATED",
        message: "Deactivate this role before permanently deleting it",
      });
    }

    const assignedUsers = await User.countDocuments({ roleId: role._id });
    if (assignedUsers > 0) {
      return res.status(409).json({
        code: "ROLE_IN_USE",
        assignedUsers,
        message: `This role is assigned to ${assignedUsers} ${assignedUsers === 1 ? "user" : "users"}. Reassign them before deleting the role.`,
      });
    }

    const childRoles = await Role.countDocuments({ parentRoleId: role._id });
    if (childRoles > 0) {
      return res.status(409).json({
        code: "ROLE_HAS_CHILDREN",
        childRoles,
        message: `This role has ${childRoles} child ${childRoles === 1 ? "role" : "roles"}. Reassign or delete the child roles first.`,
      });
    }

    await role.deleteOne();
    return res.json({
      success: true,
      deletedRole: { id: role._id, name: role.name, label: role.label },
      message: `Role '${role.label}' deleted successfully`,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to delete role",
      error: err.message,
    });
  }
};
