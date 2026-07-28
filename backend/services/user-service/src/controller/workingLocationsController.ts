import { Response } from "express";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  sanitizeWorkingLocations,
  territoryFromHomeLocation,
  formatTerritoryLabel,
  type WorkingLocationInput,
} from "../utils/workingLocations";

const CCE_ROLE_NAMES = new Set([
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
]);

const TEAM_LEAD_ROLE_NAMES = new Set([
  "team_lead",
  "team_leads",
  "customer_support_team_lead",
  "customer_support_team_leads",
  "customer_support_head",
  "super_admin",
  "admin",
]);

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isCceRole = (roleName?: string) => CCE_ROLE_NAMES.has(normalizeRole(roleName));

/**
 * Team lead / support head / admin can manage CCE territories.
 * Team leads may only edit CCEs who report to them (managerId).
 */
async function assertCanManageWorkingLocations(
  req: AuthRequest,
  targetUser: any,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!req.user?.sub && !req.user?.id) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const actorId = String(req.user.sub || req.user.id);
  const actorRole = normalizeRole(req.user.roleName || "");
  const permissions = req.user.permissions || [];

  if (["super_admin", "admin", "customer_support_head"].includes(actorRole)) {
    return { ok: true };
  }
  if (permissions.includes("user:update") || permissions.includes("team:assign_manager")) {
    // Still restrict non-global roles to CCE targets below when team lead
    if (!TEAM_LEAD_ROLE_NAMES.has(actorRole) && !permissions.includes("user:update")) {
      return { ok: false, status: 403, message: "Forbidden" };
    }
  }

  if (
    TEAM_LEAD_ROLE_NAMES.has(actorRole) ||
    permissions.includes("team:assign_manager") ||
    permissions.includes("user:update")
  ) {
    const targetRoleName = normalizeRole(
      targetUser?.roleId?.name || targetUser?.roleName || "",
    );
    if (!isCceRole(targetRoleName)) {
      return {
        ok: false,
        status: 400,
        message: "Working locations are managed for Customer Care Executives",
      };
    }

    // Super/admin/head already returned. Team lead: must be manager of target.
    if (
      ["team_lead", "team_leads", "customer_support_team_lead", "customer_support_team_leads"].includes(
        actorRole,
      )
    ) {
      if (String(targetUser.managerId || "") !== actorId) {
        return {
          ok: false,
          status: 403,
          message: "You can only manage territories for executives who report to you",
        };
      }
    }

    return { ok: true };
  }

  return { ok: false, status: 403, message: "Forbidden: cannot manage working locations" };
}

export const getUserWorkingLocations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await User.findById(userId)
      .select("name email state city locality workingLocations managerId roleId")
      .populate("roleId", "name label")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const access = await assertCanManageWorkingLocations(req, user);
    // Allow the CCE themselves to read their own territories
    const actorId = String(req.user?.sub || req.user?.id || "");
    const isSelf = actorId && actorId === String(user._id);
    if (!access.ok && !isSelf) {
      return res.status(access.status).json({ message: access.message });
    }

    const stored = Array.isArray(user.workingLocations) ? user.workingLocations : [];
    const territories =
      stored.length > 0
        ? sanitizeWorkingLocations(stored as WorkingLocationInput[])
        : territoryFromHomeLocation({
            state: user.state || "",
            city: user.city || "",
            locality: user.locality || "",
          });

    return res.status(200).json({
      success: true,
      data: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
        roleName: (user.roleId as any)?.name || null,
        homeLocation: {
          state: user.state || "",
          city: user.city || "",
          locality: user.locality || "",
        },
        workingLocations: territories,
        labels: territories.map(formatTerritoryLabel),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to load working locations",
      error: error.message,
    });
  }
};

export const updateUserWorkingLocations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await User.findById(userId).populate("roleId", "name label");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const access = await assertCanManageWorkingLocations(req, user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const next = sanitizeWorkingLocations(req.body?.workingLocations);
    if (!next.length) {
      return res.status(400).json({
        message:
          "Add at least one territory (state required). Leave city empty for entire state; leave locality empty for entire city.",
      });
    }

    user.workingLocations = next as any;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Working locations updated",
      data: {
        userId: String(user._id),
        workingLocations: next,
        labels: next.map(formatTerritoryLabel),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update working locations",
      error: error.message,
    });
  }
};
