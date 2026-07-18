import { Response } from "express";
import Role from "../models/roleModel";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";

const PROTECTED_ROLE_NAMES = new Set(["super_admin", "admin"]);

const normalizeRoleName = (name: string) => name.trim().toLowerCase();

const isRegionalManager = (req: AuthRequest) =>
  req.user?.roleName === "regional_manager";

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
    const { name, label, permissions } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        message: "name and label are required",
      });
    }

    const normalizedName = normalizeRoleName(name);

    if (rejectProtectedRoleForRegionalManager(req, res, normalizedName)) return;

    const exists = await Role.findOne({ name: normalizedName });
    if (exists) {
      return res.status(409).json({
        message: `Role '${name}' already exists`,
      });
    }

    const role = await Role.create({
      name: normalizedName,
      label,
      permissions: Array.isArray(permissions) ? permissions : [],
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


export const getAllRoles = async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: roles.length,
      roles,
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

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

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

    const existingRole = await Role.findById(id);

    if (!existingRole) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    if (rejectProtectedRoleForRegionalManager(req, res, existingRole.name)) return;

    const role = await Role.findByIdAndUpdate(
      id,
      { permissions },
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
