import User from "../models/userModel";

const PRESENCE_THROTTLE_MS = 30 * 1000;

/**
 * Stamp lastSeenAt — companies treat this as "we heard from them recently".
 * Online dashboards read lastSeenAt within a short window (e.g. 3 minutes).
 * Logout is not required.
 */
export async function touchUserPresence(
  userId: string,
  options: { force?: boolean } = {},
): Promise<Date | null> {
  if (!userId) return null;
  const now = new Date();

  if (!options.force) {
    const existing = await User.findById(userId).select("lastSeenAt").lean();
    const last = existing?.lastSeenAt ? new Date(existing.lastSeenAt).getTime() : 0;
    if (last && now.getTime() - last < PRESENCE_THROTTLE_MS) {
      return existing?.lastSeenAt ? new Date(existing.lastSeenAt) : now;
    }
  }

  await User.updateOne({ _id: userId }, { $set: { lastSeenAt: now } });
  return now;
}
