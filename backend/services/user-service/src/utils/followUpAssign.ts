import mongoose from "mongoose";
import Counter from "../models/counterModel";
import Role from "../models/roleModel";
import User from "../models/userModel";
import {
  anyTerritoryCovers,
  sanitizeWorkingLocations,
  type WorkingLocationInput,
} from "../utils/workingLocations";

const CCE_ROLE_NAMES = [
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
] as const;

const GLOBAL_RR_KEY = "follow-up-cce-round-robin";
const LOCATION_RR_KEY = "follow-up-cce-location-round-robin";

const ONBOARDING_STATUSES = new Set([
  "location_pending",
  "kyc_pending",
  "pending",
  "incomplete",
  "kyc_rejected",
]);

type ExecutiveCandidate = {
  userId: string;
  name: string;
  email: string;
  role: string;
  state: string;
  city: string;
  locality: string;
  workingLocations: WorkingLocationInput[];
};

export type FollowUpPickResult = {
  userId: string;
  name: string;
  email: string;
  role: string;
  method: "location_round_robin" | "round_robin";
};

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isCceRole = (role?: string) =>
  CCE_ROLE_NAMES.includes(normalizeRole(role || "") as (typeof CCE_ROLE_NAMES)[number]);

const nextRoundRobinIndex = async (size: number, key: string) => {
  if (size <= 0) return 0;
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  const seq = Math.max(0, Number(doc?.seq || 1) - 1);
  return seq % size;
};

const toCandidate = (user: any): ExecutiveCandidate => ({
  userId: String(user._id),
  name: String(user.name || ""),
  email: String(user.email || ""),
  role: String((user.roleId as any)?.name || "customer_care_executive"),
  state: String(user.state || ""),
  city: String(user.city || ""),
  locality: String(user.locality || ""),
  workingLocations: Array.isArray(user.workingLocations) ? user.workingLocations : [],
});

const toPickResult = (
  selected: ExecutiveCandidate,
  method: FollowUpPickResult["method"],
): FollowUpPickResult => ({
  userId: selected.userId,
  name: selected.name,
  email: selected.email,
  role: selected.role,
  method,
});

const effectiveTerritories = (exec: ExecutiveCandidate): WorkingLocationInput[] => {
  const stored = sanitizeWorkingLocations(exec.workingLocations);
  if (stored.length) return stored;
  return sanitizeWorkingLocations([
    {
      state: exec.state || "",
      city: exec.city || "",
      locality: exec.locality || "",
    },
  ]);
};

const executiveCoversLocation = (
  exec: ExecutiveCandidate,
  location?: WorkingLocationInput | null,
) => {
  if (!location?.state) return false;
  return anyTerritoryCovers(effectiveTerritories(exec), location);
};

async function listCustomerCareExecutives(): Promise<ExecutiveCandidate[]> {
  const roles = await Role.find({
    name: { $in: [...CCE_ROLE_NAMES] },
  })
    .select("_id name")
    .lean();

  const roleIds = roles.map((r) => r._id);
  if (!roleIds.length) return [];

  const users = await User.find({
    roleId: { $in: roleIds },
    isActive: { $ne: false },
    accountStatus: "active",
  })
    .select("name email state city locality workingLocations roleId")
    .populate("roleId", "name")
    .lean();

  const byId = new Map<string, ExecutiveCandidate>();
  for (const user of users) {
    const candidate = toCandidate(user);
    if (!isCceRole(candidate.role)) continue;
    byId.set(candidate.userId, candidate);
  }

  return [...byId.values()].sort((a, b) => a.userId.localeCompare(b.userId));
}

export async function pickFollowUpExecutive(
  location?: WorkingLocationInput | null,
): Promise<FollowUpPickResult | null> {
  const pool = await listCustomerCareExecutives();
  if (!pool.length) return null;

  const hasLocation = Boolean(String(location?.state || "").trim());
  if (hasLocation && location) {
    const localPool = pool.filter((exec) => executiveCoversLocation(exec, location));
    if (localPool.length) {
      const index = await nextRoundRobinIndex(localPool.length, LOCATION_RR_KEY);
      const selected = localPool[index] || localPool[0];
      if (!selected) return null;
      return toPickResult(selected, "location_round_robin");
    }
  }

  const index = await nextRoundRobinIndex(pool.length, GLOBAL_RR_KEY);
  const selected = pool[index] || pool[0];
  if (!selected) return null;
  return toPickResult(selected, "round_robin");
}

/** Assign once. Optionally reassign when current CCE does not cover the user location. */
export async function ensureFollowUpAssignee(
  user: any,
  opts?: { reassignIfNotCovering?: boolean },
): Promise<boolean> {
  if (!user) return false;

  const roleName = normalizeRole(user?.roleId?.name || user?.roleName || "");
  if (isCceRole(roleName) || roleName.includes("team_lead") || roleName.includes("admin")) {
    return false;
  }

  const location = {
    state: user.state || "",
    city: user.city || "",
    locality: user.locality || "",
  };
  const hasLocation = Boolean(String(location.state || "").trim());

  if (user.followUpAssignedTo) {
    if (!opts?.reassignIfNotCovering || !hasLocation) return false;

    const assignee = await User.findById(user.followUpAssignedTo)
      .select("name email state city locality workingLocations roleId")
      .populate("roleId", "name")
      .lean();
    if (assignee) {
      const exec = toCandidate(assignee);
      if (executiveCoversLocation(exec, location)) return false;
    }
    user.followUpAssignedTo = undefined;
    user.followUpAssignedAt = undefined;
    user.followUpAssignMethod = undefined;
  }

  const pick = await pickFollowUpExecutive(hasLocation ? location : null);
  if (!pick?.userId || !mongoose.Types.ObjectId.isValid(pick.userId)) return false;

  user.followUpAssignedTo = new mongoose.Types.ObjectId(pick.userId);
  user.followUpAssignedAt = new Date();
  user.followUpAssignMethod = pick.method;
  return true;
}

/** Backfill assignees for onboarding users missing an owner (idempotent + atomic). */
export async function ensureFollowUpAssigneesForUsers(users: any[]): Promise<number> {
  if (!Array.isArray(users) || !users.length) return 0;
  let changed = 0;
  for (const user of users) {
    if (user.followUpAssignedTo) continue;
    const status = String(user.accountStatus || "").toLowerCase();
    if (!ONBOARDING_STATUSES.has(status)) continue;

    const location = {
      state: user.state || "",
      city: user.city || "",
      locality: user.locality || "",
    };
    const hasLocation = Boolean(String(location.state || "").trim());
    const pick = await pickFollowUpExecutive(hasLocation ? location : null);
    if (!pick?.userId || !mongoose.Types.ObjectId.isValid(pick.userId)) continue;

    const assignedAt = new Date();
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [{ followUpAssignedTo: null }, { followUpAssignedTo: { $exists: false } }],
      },
      {
        $set: {
          followUpAssignedTo: new mongoose.Types.ObjectId(pick.userId),
          followUpAssignedAt: assignedAt,
          followUpAssignMethod: pick.method,
        },
      },
      { new: true },
    ).lean();

    if (!updated?.followUpAssignedTo) continue;
    user.followUpAssignedTo = updated.followUpAssignedTo;
    user.followUpAssignedAt = updated.followUpAssignedAt;
    user.followUpAssignMethod = updated.followUpAssignMethod;
    changed += 1;
  }
  return changed;
}
