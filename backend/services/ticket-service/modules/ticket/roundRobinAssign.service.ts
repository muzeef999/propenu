import mongoose from "mongoose";
import { Department } from "../department/department.model";
import type { TicketActor } from "./ticket.interface";

const CCE_ROLE_NAMES = [
  "customer_care_executive",
  "customer_care_executives",
  "customer_care",
] as const;

const COUNTER_KEY = "customer-care-round-robin";
const LOCATION_COUNTER_KEY = "customer-care-location-round-robin";

export type AssignLocation = {
  state?: string;
  city?: string;
  locality?: string;
};

type WorkingLocation = {
  state?: string;
  city?: string;
  locality?: string;
};

type ExecutiveCandidate = {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  state?: string;
  city?: string;
  locality?: string;
  workingLocations?: WorkingLocation[];
};

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    index: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "ticket_assign_counters" },
);

const AssignCounter =
  (mongoose.models.TicketAssignCounter as mongoose.Model<{ key: string; index: number }>) ||
  mongoose.model("TicketAssignCounter", counterSchema);

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeLoc = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const STATE_ALIASES: Record<string, string> = {
  ap: "andhra pradesh",
  "andhra pradesh": "andhra pradesh",
  "andhra-pradesh": "andhra pradesh",
  tg: "telangana",
  ts: "telangana",
  telangana: "telangana",
};

const normalizeState = (value?: string | null) => {
  const raw = normalizeLoc(value);
  if (!raw) return "";
  return STATE_ALIASES[raw] || raw;
};

const isCceRole = (role?: string) =>
  CCE_ROLE_NAMES.includes(normalizeRole(role) as (typeof CCE_ROLE_NAMES)[number]);

const uniqueByUserId = (items: ExecutiveCandidate[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.userId || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/** Prefer stable order so round-robin stays deterministic as pool grows. */
const sortExecutives = (items: ExecutiveCandidate[]) =>
  [...items].sort((a, b) => String(a.userId).localeCompare(String(b.userId)));

const territoryCovers = (territory: WorkingLocation, target: AssignLocation): boolean => {
  const tState = normalizeState(territory.state);
  const aState = normalizeState(target.state);
  if (!tState || !aState || tState !== aState) return false;

  const tCity = normalizeLoc(territory.city);
  if (!tCity) return true;

  const aCity = normalizeLoc(target.city);
  if (!aCity || tCity !== aCity) return false;

  const tLoc = normalizeLoc(territory.locality);
  if (!tLoc) return true;

  const aLoc = normalizeLoc(target.locality);
  return Boolean(aLoc && tLoc === aLoc);
};

/** Effective territories: explicit workingLocations, else home work location. */
const effectiveTerritories = (exec: ExecutiveCandidate): WorkingLocation[] => {
  const stored = Array.isArray(exec.workingLocations) ? exec.workingLocations : [];
  const cleaned = stored.filter((row) => normalizeLoc(row?.state));
  if (cleaned.length) return cleaned;
  const state = String(exec.state || "").trim();
  if (normalizeLoc(state)) {
    return [
      {
        state,
        ...(normalizeLoc(exec.city) ? { city: exec.city } : {}),
        ...(normalizeLoc(exec.locality) ? { locality: exec.locality } : {}),
      },
    ];
  }
  return [];
};

const executiveCoversLocation = (exec: ExecutiveCandidate, location?: AssignLocation | null) => {
  if (!location || !normalizeLoc(location.state)) return false;
  return effectiveTerritories(exec).some((row) => territoryCovers(row, location));
};

async function loadFromDepartment(): Promise<ExecutiveCandidate[]> {
  const department = await Department.findOne({
    slug: "customer-care",
    isActive: { $ne: false },
  })
    .select("members")
    .lean();

  const members = Array.isArray(department?.members) ? department.members : [];
  return members
    .filter((member: any) => member?.userId)
    .map((member: any) => ({
      userId: String(member.userId),
      name: member.name || undefined,
      email: member.email || undefined,
      role: normalizeRole(member.role) || "customer_care_executive",
    }))
    .filter((member) => isCceRole(member.role));
}

/**
 * Best-effort lookup against shared Mongo users/roles collections.
 * If ticket-service uses a different DB, this safely returns [].
 */
async function loadFromUsersCollection(): Promise<ExecutiveCandidate[]> {
  try {
    const db = mongoose.connection?.db;
    if (!db) return [];

    const roles = await db
      .collection("roles")
      .find({ name: { $in: [...CCE_ROLE_NAMES] } })
      .project({ _id: 1, name: 1 })
      .toArray();

    if (!roles.length) return [];

    const roleIds = roles.map((role) => role._id);
    const roleNameById = new Map(roles.map((role) => [String(role._id), String(role.name || "")]));

    const users = await db
      .collection("users")
      .find({
        roleId: { $in: roleIds },
        $or: [
          { accountStatus: { $exists: false } },
          { accountStatus: { $nin: ["inactive", "deleted", "blocked"] } },
        ],
        isActive: { $ne: false },
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        roleId: 1,
        state: 1,
        city: 1,
        locality: 1,
        workingLocations: 1,
      })
      .toArray();

    return users.map((user) => ({
      userId: String(user._id),
      name: user.name || undefined,
      email: user.email || undefined,
      role: normalizeRole(roleNameById.get(String(user.roleId))) || "customer_care_executive",
      state: user.state || undefined,
      city: user.city || undefined,
      locality: user.locality || undefined,
      workingLocations: Array.isArray(user.workingLocations) ? user.workingLocations : [],
    }));
  } catch (error) {
    console.warn("round-robin user lookup skipped:", error);
    return [];
  }
}

export async function listCustomerCareExecutives(): Promise<ExecutiveCandidate[]> {
  const [fromDept, fromUsers] = await Promise.all([loadFromDepartment(), loadFromUsersCollection()]);
  // Prefer users collection (live role list); merge department members as extras.
  const merged = uniqueByUserId([...fromUsers, ...fromDept]);
  // Enrich dept-only members with location fields from users when possible.
  const byId = new Map(fromUsers.map((u) => [u.userId, u]));
  const enriched = merged.map((item): ExecutiveCandidate => {
    const fromUser = byId.get(item.userId);
    if (!fromUser) return item;
    const enrichedItem: ExecutiveCandidate = {
      ...item,
    };
    const state = item.state || fromUser.state;
    const city = item.city || fromUser.city;
    const locality = item.locality || fromUser.locality;
    const workingLocations = item.workingLocations?.length
      ? item.workingLocations
      : fromUser.workingLocations;

    if (state) enrichedItem.state = state;
    if (city) enrichedItem.city = city;
    if (locality) enrichedItem.locality = locality;
    if (workingLocations?.length) enrichedItem.workingLocations = workingLocations;

    return enrichedItem;
  });
  return sortExecutives(enriched);
}

async function nextRoundRobinIndex(poolSize: number, counterKey = COUNTER_KEY): Promise<number> {
  if (poolSize <= 0) return 0;

  const counter = await AssignCounter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { index: 1 } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  const raw = Number(counter?.index ?? 1);
  if (!Number.isFinite(raw)) return 0;
  return ((raw - 1) % poolSize + poolSize) % poolSize;
}

const toActor = (selected: ExecutiveCandidate): TicketActor | null => {
  if (!selected?.userId) return null;
  const actor: TicketActor = {
    userId: selected.userId,
    role: selected.role || "customer_care_executive",
  };
  if (selected.name) actor.name = selected.name;
  if (selected.email) actor.email = selected.email;
  return actor;
};

export type PickExecutiveResult = {
  actor: TicketActor;
  method: "location_round_robin" | "round_robin";
};

/**
 * Pick next Customer Care Executive.
 * When location is provided, prefer CCEs whose workingLocations (or home location)
 * cover that territory; if none match, fall back to global round-robin (existing behavior).
 */
export async function pickNextCustomerCareExecutive(
  location?: AssignLocation | null,
): Promise<TicketActor | null> {
  const result = await pickNextCustomerCareExecutiveDetailed(location);
  return result?.actor || null;
}

export async function pickNextCustomerCareExecutiveDetailed(
  location?: AssignLocation | null,
): Promise<PickExecutiveResult | null> {
  const pool = await listCustomerCareExecutives();
  if (!pool.length) return null;

  const hasLocation = Boolean(normalizeLoc(location?.state));
  if (hasLocation && location) {
    const localPool = pool.filter((exec) => executiveCoversLocation(exec, location));
    if (localPool.length) {
      const index = await nextRoundRobinIndex(localPool.length, LOCATION_COUNTER_KEY);
      const selected = localPool[index] ?? localPool[0];
      if (!selected) return null;
      const actor = toActor(selected);
      if (!actor) return null;
      return { actor, method: "location_round_robin" };
    }
  }

  const index = await nextRoundRobinIndex(pool.length, COUNTER_KEY);
  const selected = pool[index] ?? pool[0];
  if (!selected) return null;
  const actor = toActor(selected);
  if (!actor) return null;
  return { actor, method: "round_robin" };
}

export function shouldAutoAssignCustomerCare(input: {
  assignedTo?: TicketActor;
  isRelationshipManagerTicket?: boolean;
  department?: string;
}): boolean {
  if (input.isRelationshipManagerTicket) return false;
  if (input.assignedTo?.userId) return false;
  if (input.department && input.department !== "customer-care") return false;
  return true;
}

/** Resolve location from ticket metadata / requester fields (additive). */
export function resolveAssignLocation(input: {
  metadata?: Record<string, any>;
  requester?: Record<string, any>;
}): AssignLocation | null {
  const meta = input.metadata || {};
  const requester = input.requester || {};
  const state =
    meta.state || meta.requesterState || requester.state || meta.location?.state || "";
  const city =
    meta.city || meta.requesterCity || requester.city || meta.location?.city || "";
  const locality =
    meta.locality ||
    meta.requesterLocality ||
    requester.locality ||
    meta.location?.locality ||
    "";
  if (!normalizeLoc(state)) return null;
  return {
    state: String(state).trim(),
    ...(String(city || "").trim() ? { city: String(city).trim() } : {}),
    ...(String(locality || "").trim() ? { locality: String(locality).trim() } : {}),
  };
}

/** Look up requester user location from shared users collection when missing on ticket. */
export async function lookupRequesterLocation(input: {
  userId?: string;
  email?: string;
}): Promise<AssignLocation | null> {
  try {
    const db = mongoose.connection?.db;
    if (!db) return null;

    const filter: Record<string, any> = {};
    if (input.userId && mongoose.Types.ObjectId.isValid(input.userId)) {
      filter._id = new mongoose.Types.ObjectId(input.userId);
    } else if (input.email) {
      filter.email = String(input.email).trim().toLowerCase();
    } else {
      return null;
    }

    const user = await db
      .collection("users")
      .findOne(filter, { projection: { state: 1, city: 1, locality: 1 } });

    if (!user || !normalizeLoc(user.state)) return null;
    return {
      state: String(user.state).trim(),
      ...(user.city ? { city: String(user.city).trim() } : {}),
      ...(user.locality ? { locality: String(user.locality).trim() } : {}),
    };
  } catch {
    return null;
  }
}
