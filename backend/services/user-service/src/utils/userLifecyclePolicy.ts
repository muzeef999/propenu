const normalize = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Legacy / plural aliases → canonical role key. */
const ROLE_ALIASES: Record<string, string> = {
  team_lead: "customer_support_team_lead",
  team_leads: "customer_support_team_lead",
  customer_support_team_leads: "customer_support_team_lead",
  customer_care: "customer_care_executive",
  customer_care_executives: "customer_care_executive",
  relationship_managers: "relationship_manager",
  operation_head: "operations_head",
  sales_agent: "sales_executive",
  sales_executives: "sales_executive",
};

export const canonicalLifecycleRole = (value?: string | null) => {
  const key = normalize(value);
  return ROLE_ALIASES[key] || key;
};

/** Marketplace / listing accounts Business Development Head may activate|deactivate|delete. */
export const BDH_LIFECYCLE_TARGET_ROLES = new Set([
  "user",
  "builder",
  "builder_staff",
  "agent",
]);

/**
 * Hierarchy managers → staff roles they may activate / deactivate / delete / edit.
 * Mirrors support-branch STRICT_BRANCH_ROLES (+ aliases resolved via canonical).
 */
export const HIERARCHY_LIFECYCLE_TARGETS: Record<string, Set<string>> = {
  customer_support_head: new Set([
    "customer_support_team_lead",
    "customer_care_executive",
    "relationship_manager",
  ]),
  customer_support_team_lead: new Set([
    "customer_care_executive",
    "relationship_manager",
  ]),
  operations_head: new Set([
    "customer_support_head",
    "customer_support_team_lead",
    "customer_care_executive",
    "relationship_manager",
    "business_development_head",
    "regional_manager",
    "business_development_manager",
    "sales_manager",
    "sales_executive",
    "marketing_head",
    "digital_marketing",
    "social_media",
    "content_team",
    "creative_team",
    "performance_marketing",
    "accounts",
    "legal_compliance",
    "hr_administration",
    "technical_support_head",
    "technical_support_team",
  ]),
};

export const HIERARCHY_LIFECYCLE_ACTORS = new Set(
  Object.keys(HIERARCHY_LIFECYCLE_TARGETS),
);

export function assertCanManageUserLifecycle(opts: {
  actorRoleName?: string | null;
  targetRoleName?: string | null;
  actorUserId?: string | null;
  targetUserId?: string | null;
}): { ok: true } | { ok: false; status: number; message: string } {
  const actor = canonicalLifecycleRole(opts.actorRoleName || "");
  const target = canonicalLifecycleRole(opts.targetRoleName || "");
  const actorId = String(opts.actorUserId || "");
  const targetId = String(opts.targetUserId || "");

  if (actorId && targetId && actorId === targetId) {
    return {
      ok: false,
      status: 400,
      message: "You cannot change your own account status here",
    };
  }

  if (target === "super_admin") {
    return {
      ok: false,
      status: 403,
      message: "Super Admin accounts cannot be changed here",
    };
  }

  if (actor === "super_admin" || actor === "admin") {
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

  const allowedTargets = HIERARCHY_LIFECYCLE_TARGETS[actor];
  if (allowedTargets) {
    if (!allowedTargets.has(target)) {
      return {
        ok: false,
        status: 403,
        message:
          "You can only activate, deactivate, edit, or delete staff in your hierarchy",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    message:
      "Forbidden: only Super Admin, hierarchy managers, or Business Development Head can do this",
  };
}
