const LEAD_ALLOWANCE_ROLES = new Set([
  "super_admin",
  "admin",
  "business_development_head",
  "bdh",
]);

/** Super Admin, Admin, and Business Development Head may set visible lead allowance. */
export function canSetVisibleLeadAllowance(roleName?: string | null) {
  const role = String(roleName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return LEAD_ALLOWANCE_ROLES.has(role);
}

/**
 * Apply a requested visible-lead allowance only for roles that may set it.
 * Other roles keep the current allowance. Normal listings always mask leads.
 */
export function resolveVisibleLeadLimit(options: {
  roleName?: string | null | undefined;
  requested: number | null;
  current?: number | null | undefined;
  forceZero?: boolean;
}): number | undefined {
  if (options.forceZero) return 0;

  if (
    canSetVisibleLeadAllowance(options.roleName) &&
    options.requested !== null &&
    options.requested !== undefined &&
    Number.isFinite(options.requested) &&
    options.requested >= 0
  ) {
    return Math.trunc(options.requested);
  }

  if (
    typeof options.current === "number" &&
    Number.isFinite(options.current) &&
    options.current >= 0
  ) {
    return Math.trunc(options.current);
  }

  return undefined;
}
