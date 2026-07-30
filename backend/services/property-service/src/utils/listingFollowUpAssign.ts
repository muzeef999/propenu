import mongoose from "mongoose";
import User from "../models/userModel";
import Role from "../models/roleModel";
import {
  anyTerritoryCovers,
  sanitizeWorkingLocations,
  type WorkingLocationInput,
} from "./workingLocations";

const CCE_ROLE_NAMES = [
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
] as const;

type CceCandidate = {
  _id: mongoose.Types.ObjectId;
  state?: string;
  city?: string;
  locality?: string;
  workingLocations?: WorkingLocationInput[];
};

type SyncAction = "kept" | "reassigned" | "assigned" | "skipped";
type SyncResult = { action: SyncAction; ownerId?: string };

const listingLocationOf = (doc: any): WorkingLocationInput | null => {
  const state = String(doc?.state || "").trim();
  if (!state) return null;
  return {
    state,
    city: String(doc?.city || "").trim() || undefined,
    locality: String(doc?.locality || "").trim() || undefined,
  };
};

const effectiveTerritories = (exec: CceCandidate) => {
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
  exec: CceCandidate,
  location: WorkingLocationInput,
) => anyTerritoryCovers(effectiveTerritories(exec), location);

const stableIndex = (seed: string, size: number) => {
  if (size <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % size;
};

async function listCustomerCareExecutives(): Promise<CceCandidate[]> {
  const roles = await Role.find({ name: { $in: [...CCE_ROLE_NAMES] } })
    .select("_id")
    .lean();
  const roleIds = roles.map((r) => r._id);
  if (!roleIds.length) return [];

  const users = await User.find({
    roleId: { $in: roleIds },
    isActive: { $ne: false },
  })
    .select("_id state city locality workingLocations")
    .lean();

  return users as CceCandidate[];
}

async function pickCceForLocation(
  location: WorkingLocationInput | null,
  seed: string,
): Promise<mongoose.Types.ObjectId | null> {
  const pool = await listCustomerCareExecutives();
  if (!pool.length) return null;

  if (location?.state) {
    const local = pool.filter((exec) => executiveCoversLocation(exec, location));
    if (local.length > 0) {
      const idx = stableIndex(seed, local.length);
      const selected = local[idx] as CceCandidate | undefined;
      if (selected) return selected._id;
    }
  }

  const fallback = pool[stableIndex(seed, pool.length)] as CceCandidate | undefined;
  return fallback ? fallback._id : null;
}

const clearListingOwner = (doc: any) => {
  doc.followUpAssignedTo = undefined;
  doc.followUpAssignedAt = undefined;
  doc.followUpWorkStatus = undefined;
  doc.followUpWorkUpdatedAt = undefined;
  doc.followUpWorkUpdatedBy = undefined;
};

const setListingOwner = (doc: any, ownerId: mongoose.Types.ObjectId) => {
  doc.followUpAssignedTo = ownerId;
  doc.followUpAssignedAt = new Date();
  doc.followUpWorkStatus = "assigned";
  doc.followUpWorkUpdatedAt = new Date();
  doc.followUpWorkUpdatedBy = undefined;
};

const syncResult = (action: SyncAction, ownerId?: string): SyncResult => {
  if (ownerId) return { action, ownerId };
  return { action };
};

/**
 * Copy creator's exclusive CCE onto the listing at draft/save time
 * (before listing location exists).
 */
export async function applyListingFollowUpOwner(doc: any): Promise<boolean> {
  if (!doc) return false;
  if (doc.followUpAssignedTo) {
    if (!doc.followUpWorkStatus) {
      doc.followUpWorkStatus = "assigned";
      if (!doc.followUpWorkUpdatedAt) doc.followUpWorkUpdatedAt = new Date();
    }
    return false;
  }

  const creatorId = doc.createdBy;
  if (!creatorId || !mongoose.Types.ObjectId.isValid(String(creatorId))) {
    return false;
  }

  const creator = await User.findById(creatorId)
    .select("followUpAssignedTo followUpAssignedAt")
    .lean();
  const ownerId = creator?.followUpAssignedTo
    ? String(creator.followUpAssignedTo)
    : "";
  if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) return false;

  setListingOwner(doc, new mongoose.Types.ObjectId(ownerId));
  if (creator?.followUpAssignedAt) {
    doc.followUpAssignedAt = new Date(creator.followUpAssignedAt);
  }
  return true;
}

/**
 * After property Location step (completion ~45%):
 * - If current CCE still covers listing location → keep (do not hide)
 * - Else hide old owner and auto-assign by listing location territory
 */
export async function syncListingFollowUpAfterLocation(
  doc: any,
): Promise<SyncResult> {
  if (!doc) return syncResult("skipped");

  const location = listingLocationOf(doc);
  const seed = String(doc._id || doc.createdBy || Date.now());

  // No listing state yet — fall back to creator CCE only.
  if (!location?.state) {
    const did = await applyListingFollowUpOwner(doc);
    const ownerId = doc.followUpAssignedTo
      ? String(doc.followUpAssignedTo)
      : "";
    if (did) return syncResult("assigned", ownerId);
    if (ownerId) return syncResult("kept", ownerId);
    return syncResult("skipped");
  }

  const currentId = doc.followUpAssignedTo ? String(doc.followUpAssignedTo) : "";
  if (currentId && mongoose.Types.ObjectId.isValid(currentId)) {
    const current = await User.findById(currentId)
      .select("_id state city locality workingLocations isActive")
      .lean();
    if (
      current &&
      current.isActive !== false &&
      executiveCoversLocation(current as CceCandidate, location)
    ) {
      if (!doc.followUpWorkStatus) {
        doc.followUpWorkStatus = "assigned";
        doc.followUpWorkUpdatedAt = new Date();
      }
      return syncResult("kept", currentId);
    }
    clearListingOwner(doc);
  }

  const picked = await pickCceForLocation(location, seed);
  if (picked) {
    setListingOwner(doc, picked);
    return syncResult(currentId ? "reassigned" : "assigned", String(picked));
  }

  // No territory CCE found — fall back to creator's CCE.
  const did = await applyListingFollowUpOwner(doc);
  const ownerId = doc.followUpAssignedTo ? String(doc.followUpAssignedTo) : "";
  if (did) {
    return syncResult(currentId ? "reassigned" : "assigned", ownerId);
  }
  if (ownerId) return syncResult("kept", ownerId);
  return syncResult("skipped");
}

/** Mongoose plugin: draft uses creator CCE; with listing state keep/reassign by territory. */
export function listingFollowUpPlugin(schema: mongoose.Schema) {
  schema.pre("save", async function (next) {
    try {
      if (String((this as any).state || "").trim()) {
        await syncListingFollowUpAfterLocation(this);
      } else {
        await applyListingFollowUpOwner(this);
      }
      next();
    } catch (err) {
      next(err as Error);
    }
  });
}
