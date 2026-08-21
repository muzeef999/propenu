const normalize = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Marketplace / listing accounts Business Development Head may activate|deactivate|delete. */
export const BDH_LIFECYCLE_TARGET_ROLES = new Set([
  "user",
  "builder",
  "builder_staff",
  "agent",
]);

export function assertCanManageUserLifecycle(opts: {
  actorRoleName?: string | null;
  targetRoleName?: string | null;
  actorUserId?: string | null;
  targetUserId?: string | null;
}): { ok: true } | { ok: false; status: number; message: string } {
  const actor = normalize(opts.actorRoleName || "");
  const target = normalize(opts.targetRoleName || "");
  const actorId = String(opts.actorUserId || "");
  const targetId = String(opts.targetUserId || "");

  if (actorId && targetId && actorId === targetId) {
    return { ok: false, status: 400, message: "You cannot change your own account status here" };
  }

  if (target === "super_admin") {
    return {
      ok: false,
      status: 403,
      message: "Super Admin accounts cannot be changed here",
    };
  }

  if (actor === "super_admin") {
    return { ok: true };
  }

  if (actor === "business_development_head") {
    if (!BDH_LIFECYCLE_TARGET_ROLES.has(target)) {
      return {
        ok: false,
        status: 403,
        message:
          "Business Development Head can only activate, deactivate, or delete owners, builders, builder staff, and agents",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    message: "Forbidden: only Super Admin or Business Development Head can do this",
  };
}
