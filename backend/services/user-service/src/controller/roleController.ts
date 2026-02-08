import { Request, Response } from "express";
import Role from "../models/roleModel";
import mongoose from "mongoose";

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, label, permissions } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        message: "name and label are required",
      });
    }

    const exists = await Role.findOne({ name: name.toLowerCase() });
    if (exists) {
      return res.status(409).json({
        message: `Role '${name}' already exists`,
      });
    }

    const role = await Role.create({
      name: name.toLowerCase(),
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


export const getAllRoles = async (_req: Request, res: Response) => {
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


export const getRoleById = async (req: Request, res: Response) => {
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


export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        message: "permissions must be an array",
      });
    }

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
