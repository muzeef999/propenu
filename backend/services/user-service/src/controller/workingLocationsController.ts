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
]);

const GLOBAL_MANAGE_ROLES = new Set([
  "super_admin",
  "admin",
  "customer_support_head",
]);

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isCceRole = (roleName?: string) => CCE_ROLE_NAMES.has(normalizeRole(roleName));

const isTeamLeadRole = (roleName?: string) =>
  TEAM_LEAD_ROLE_NAMES.has(normalizeRole(roleName));

const asId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

/**
 * True when actor is the direct manager, or appears in the manager chain.
 */
async function actorManagesUser(targetUser: any, actorId: string): Promise<boolean> {
  if (!actorId) return false;

  let current = asId(targetUser?.managerId);
  if (current === actorId) return true;

  let guard = 0;
  while (current && guard < 8) {
    if (current === actorId) return true;
    const mgr = await User.findById(current).select("managerId").lean();
    current = asId(mgr?.managerId);
    guard += 1;
  }
  return false;
}

/**
 * Team lead / support head / admin can manage CCE territories.
 * Team leads may edit CCEs who report to them (managerId / chain),
 * or unbound CCEs in their pod (no manager yet) — then bind on save.
 */
async function assertCanManageWorkingLocations(
  req: AuthRequest,
  targetUser: any,
): Promise<
  | { ok: true; bindManager?: boolean }
  | { ok: false; status: number; message: string }
> {
  if (!req.user?.sub && !req.user?.id) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const actorId = String(req.user.sub || req.user.id);
  const actorRole = normalizeRole(req.user.roleName || "");
  const permissions = req.user.permissions || [];

  if (GLOBAL_MANAGE_ROLES.has(actorRole)) {
    return { ok: true };
  }

  const canManageStaff =
    isTeamLeadRole(actorRole) ||
    permissions.includes("team:assign_manager") ||
    permissions.includes("user:update");

  if (!canManageStaff) {
    return { ok: false, status: 403, message: "Forbidden: cannot manage working locations" };
  }

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

  // Non–team-lead staff with user:update (e.g. ops) may manage any CCE.
  if (!isTeamLeadRole(actorRole)) {
    return { ok: true };
  }

  const managed = await actorManagesUser(targetUser, actorId);
  if (managed) {
    return { ok: true };
  }

  // CCE visible in Team Lead directory but not yet linked via reportsTo/managerId.
  const targetManagerId = asId(targetUser?.managerId);
  if (!targetManagerId) {
    return { ok: true, bindManager: true };
  }

  // Common mis-link: CCE reports to Support Head instead of Team Lead.
  // If this TL reports to that same Head, allow manage + re-bind to the TL.
  const targetManager = await User.findById(targetManagerId)
    .select("roleId")
    .populate("roleId", "name")
    .lean();
  const targetManagerRole = normalizeRole((targetManager?.roleId as any)?.name || "");
  if (targetManagerRole === "customer_support_head") {
    const actor = await User.findById(actorId).select("managerId").lean();
    if (asId(actor?.managerId) === targetManagerId) {
      return { ok: true, bindManager: true };
    }
  }

  return {
    ok: false,
    status: 403,
    message:
      "You can only manage territories for executives who report to you. Assign this CCE to you under Reports To, then try again.",
  };
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
        managerId: asId(user.managerId) || null,
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

    // Bind unbound CCE to this Team Lead so future territory edits + RR stay scoped.
    if (access.bindManager) {
      const actorId = String(req.user?.sub || req.user?.id || "");
      if (actorId) {
        user.managerId = actorId as any;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Working locations updated",
      data: {
        userId: String(user._id),
        managerId: asId(user.managerId) || null,
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
