const idOf = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
};

const managerIdOf = (user: any): string =>
  idOf(user?.managerId) || idOf(user?.reportsTo?._id) || idOf(user?.reportsTo);

/**
 * Keep staff whose reports-to chain reaches this manager.
 * Direct reports and nested reports (SE → BDM → this RM) stay.
 * People reporting to another manager, or with no reporting line, are excluded.
 */
export function filterUsersInReportingTree<T extends Record<string, any>>(
  users: T[] = [],
  actorId?: string | null,
): T[] {
  const actor = String(actorId || "").trim();
  if (!actor) return [];

  const byId = new Map<string, T>();
  users.forEach((user) => {
    const id = idOf(user?._id || user?.id);
    if (id) byId.set(id, user);
  });

  const cache = new Map<string, boolean>();

  const reportsToActor = (userId: string, seen = new Set<string>()): boolean => {
    if (!userId || userId === actor) return false;
    if (cache.has(userId)) return Boolean(cache.get(userId));
    if (seen.has(userId)) {
      cache.set(userId, false);
      return false;
    }
    seen.add(userId);

    const user = byId.get(userId);
    const managerId = managerIdOf(user);
    if (!managerId) {
      cache.set(userId, false);
      return false;
    }
    if (managerId === actor) {
      cache.set(userId, true);
      return true;
    }

    const ok = reportsToActor(managerId, seen);
    cache.set(userId, ok);
    return ok;
  };

  return users.filter((user) => {
    const id = idOf(user?._id || user?.id);
    if (!id || id === actor) return false;
    return reportsToActor(id);
  });
}
