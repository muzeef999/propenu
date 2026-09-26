import mongoose from "mongoose";

/** Listings owned or posted by this user (createdBy ObjectId or embedded, or postedBy.userId). */
export const ownerUserClause = (userId: string) => {
  const id = new mongoose.Types.ObjectId(userId);
  return {
    $or: [{ createdBy: id }, { "createdBy._id": id }, { "postedBy.userId": id }],
  };
};

export const applyOwnerUserFilter = (
  filter: Record<string, any>,
  userId?: string,
) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return filter;
  const clause = ownerUserClause(userId);
  if (filter.$or) {
    filter.$and = [...(filter.$and || []), { $or: filter.$or }, clause];
    delete filter.$or;
  } else {
    Object.assign(filter, clause);
  }
  return filter;
};

export const ownerListLimit = (options?: {
  ownerUserId?: string | undefined;
  limit?: number | undefined;
}) => {
  const scoped = Boolean(options?.ownerUserId);
  const cap = scoped ? 12 : 100;
  const fallback = scoped ? 12 : 20;
  return Math.min(cap, Math.max(1, Number(options?.limit) || fallback));
};

export const readOwnerUserId = (query: Record<string, any> = {}) => {
  const raw = String(query.ownerUserId || "").trim();
  if (!raw) return { ownerUserId: "" as string };
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    return { error: "Invalid ownerUserId" as const };
  }
  return { ownerUserId: raw };
};
