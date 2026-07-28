/** Hierarchy-aware project create/approve policy (property-service). */

const ROLE_ALIASES: Record<string, string> = {
  customer_care: "customer_care_executive",
  customer_care_executives: "customer_care_executive",
  relationship_managers: "relationship_manager",
  sales_executives: "sales_executive",
  team_leads: "team_lead",
  customer_support_team_lead: "team_lead",
  operation_head: "operations_head",
};

/** Higher rank = higher authority. */
const ROLE_RANK: Record<string, number> = {
  customer_care_executive: 10,
  relationship_manager: 12,
  sales_agent: 10,
  sales_executive: 10,
  agent: 10,
  team_lead: 20,
  customer_support_head: 30,
  sales_manager: 40,
  regional_manager: 50,
  business_development_manager: 45,
  business_development_head: 60,
  operations_head: 70,
  ceo: 80,
  founder: 85,
  admin: 90,
  super_admin: 100,
  builder: 15,
  builder_staff: 12,
  user: 5,
};

/** Creators that must wait for approval (pending → live). */
const REQUIRES_APPROVAL_ON_CREATE = new Set([
  "customer_care_executive",
  "relationship_manager",
  "sales_agent",
  "sales_executive",
  "team_lead",
  "customer_support_head",
  "builder",
  "builder_staff",
  "user",
]);

/** Roles that may approve pending projects when rank is high enough. */
const APPROVER_ROLES = new Set([
  "regional_manager",
  "sales_manager",
  "business_development_head",
  "business_development_manager",
  "operations_head",
  "ceo",
  "founder",
  "admin",
  "super_admin",
]);

export const normalizeProjectRole = (roleName?: string | null) => {
  const key = String(roleName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ROLE_ALIASES[key] || key;
};

export const getProjectRoleRank = (roleName?: string | null) => {
  const role = normalizeProjectRole(roleName);
  return ROLE_RANK[role] ?? 0;
};

export const projectRequiresApprovalOnCreate = (roleName?: string | null) => {
  const role = normalizeProjectRole(roleName);
  if (role === "super_admin" || role === "admin") return false;
  if (role === "regional_manager" || role === "operations_head" || role === "ceo") {
    return false;
  }
  if (role === "sales_manager" || role === "business_development_head") return false;
  return REQUIRES_APPROVAL_ON_CREATE.has(role) || getProjectRoleRank(role) < 50;
};

export const canApproveProjectByHierarchy = (params: {
  actorRole?: string | null | undefined;
  actorId?: string | null | undefined;
  creatorRole?: string | null | undefined;
  creatorId?: string | null | undefined;
  hasApprovePermission?: boolean | undefined;
}) => {
  const actorRole = normalizeProjectRole(params.actorRole);
  const creatorRole = normalizeProjectRole(params.creatorRole);
  const actorRank = getProjectRoleRank(actorRole);
  const creatorRank = getProjectRoleRank(creatorRole);

  if (!actorRole) return { ok: false, reason: "Unauthorized" };

  // Cannot approve own submission (except platform admins)
  if (
    params.actorId &&
    params.creatorId &&
    String(params.actorId) === String(params.creatorId) &&
    actorRole !== "super_admin" &&
    actorRole !== "admin"
  ) {
    return { ok: false, reason: "You cannot approve your own project" };
  }

  if (actorRole === "super_admin" || actorRole === "admin") {
    return { ok: true };
  }

  const isDesignatedApprover =
    APPROVER_ROLES.has(actorRole) || Boolean(params.hasApprovePermission);

  if (!isDesignatedApprover) {
    return {
      ok: false,
      reason: "You do not have permission to approve projects",
    };
  }

  // Must be higher in hierarchy than the creator (RM first gate for CC, etc.)
  if (creatorRole && actorRank <= creatorRank) {
    return {
      ok: false,
      reason: "Only a higher hierarchy role can approve this project",
    };
  }

  // Regional Manager is the primary first approver for CC creators.
  // Sales Manager may approve sales/agent/user listings below them.
  if (
    actorRank < getProjectRoleRank("regional_manager") &&
    creatorRank <= getProjectRoleRank("customer_care_executive")
  ) {
    const smMayApprove = new Set([
      "sales_agent",
      "sales_executive",
      "agent",
      "user",
      "builder",
      "builder_staff",
    ]);
    if (actorRole === "sales_manager" && smMayApprove.has(creatorRole)) {
      return { ok: true };
    }
    // CC onboarding → RM (or higher) first
    if (
      creatorRole === "customer_care_executive" ||
      creatorRole === "relationship_manager"
    ) {
      return {
        ok: false,
        reason: "Regional Manager (or higher) must approve this onboarding item",
      };
    }
    return {
      ok: false,
      reason: "Only a higher hierarchy role can approve this item",
    };
  }

  return { ok: true };
};

export const canCreateProjectByRole = (params: {
  roleName?: string | null;
  hasCreatePermission?: boolean;
}) => {
  const role = normalizeProjectRole(params.roleName);
  if (role === "super_admin" || role === "admin") return true;
  if (params.hasCreatePermission) return true;
  return [
    "builder",
    "sales_manager",
    "sales_agent",
    "sales_executive",
    "customer_care_executive",
    "relationship_manager",
    "regional_manager",
    "operations_head",
    "business_development_head",
    "ceo",
    "team_lead",
  ].includes(role);
};
