import { Types } from "mongoose";
import Role from "../models/roleModel";

/**
 * Canonical org tree (source of truth):
 * Super Admin
 * ├── CEO
 * └── Operations Head
 *     ├── Business Development Head
 *     │   └── Regional Manager
 *     │       ├── Business Development Manager
 *     │       └── Sales Executive
 *     ├── Customer Support Head
 *     │   └── Customer Support Team Lead
 *     │       ├── Customer Care Executive
 *     │       └── Relationship Manager
 *     ├── Marketing Head
 *     │   ├── Digital Marketing
 *     │   ├── Social Media
 *     │   ├── Content Team
 *     │   └── Creative Team
 *     ├── Accounts
 *     ├── Legal
 *     ├── HR
 *     └── Technical Support Head
 *         └── Technical Support Team
 */
const CANONICAL_PARENT_BY_ROLE: Record<string, string> = {
  ceo: "super_admin",
  founder: "super_admin",
  operations_head: "super_admin",
  operation_head: "super_admin",
  business_development_head: "operations_head",
  regional_manager: "business_development_head",
  business_development_manager: "regional_manager",
  // Keep sales_manager under RM for existing Assign Executive flows
  sales_manager: "regional_manager",
  sales_executive: "regional_manager",
  sales_executives: "regional_manager",
  sales_agent: "regional_manager",
  customer_support_head: "operations_head",
  customer_support_team_lead: "customer_support_head",
  team_lead: "customer_support_head",
  team_leads: "customer_support_head",
  customer_care: "team_lead",
  customer_care_executive: "team_lead",
  customer_care_executives: "team_lead",
  relationship_manager: "team_lead",
  relationship_managers: "team_lead",
  marketing_head: "operations_head",
  digital_marketing: "marketing_head",
  social_media: "marketing_head",
  content_team: "marketing_head",
  creative_team: "marketing_head",
  accounts: "operations_head",
  accounts_finance: "operations_head",
  legal_compliance: "operations_head",
  hr_administration: "operations_head",
  technical_support_head: "operations_head",
  technical_support_team: "technical_support_head",
};

const ROLE_NAME_ALIASES: Record<string, string> = {
  operation_head: "operations_head",
  customer_support_team_lead: "team_lead",
  customer_support_team_leads: "team_lead",
  team_leads: "team_lead",
  customer_care: "customer_care_executive",
  customer_care_executives: "customer_care_executive",
  relationship_managers: "relationship_manager",
  sales_executives: "sales_executive",
  sales_agent: "sales_executive",
  accounts_finance: "accounts",
  // Label-style / spaced names from older seeds
  customer_support_team_lead_role: "team_lead",
  owners: "user",
  owner: "user",
  users: "user",
  agents: "agent",
  builders: "builder",
};

/** Normalize any role label/name → snake_case key (handles spaces / Title Case). */
const normalizeRoleKey = (name?: string | null) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const canonicalName = (name?: string | null) => {
  const key = normalizeRoleKey(name);
  if (!key) return "";
  return ROLE_NAME_ALIASES[key] || key;
};

export const getCanonicalParentRoleName = (roleName?: string | null) => {
  const key = canonicalName(roleName);
  if (!key) return null;
  const parent =
    CANONICAL_PARENT_BY_ROLE[key] ||
    CANONICAL_PARENT_BY_ROLE[normalizeRoleKey(roleName)] ||
    null;
  return parent ? canonicalName(parent) : null;
};

/** Dashboard roles that must exist for a complete Operations Head tree. */
const HIERARCHY_ROLE_DEFS: Array<{ name: string; label: string }> = [
  { name: "ceo", label: "CEO" },
  { name: "operations_head", label: "Operations Head" },
  { name: "business_development_head", label: "Business Development Head" },
  { name: "regional_manager", label: "Regional Manager" },
  { name: "business_development_manager", label: "Business Development Manager" },
  { name: "sales_manager", label: "Sales Manager" },
  { name: "sales_agent", label: "Sales Executive" },
  { name: "customer_support_head", label: "Customer Support Head" },
  { name: "team_lead", label: "Customer Support Team Lead" },
  { name: "customer_care_executive", label: "Customer Care Executive" },
  { name: "relationship_manager", label: "Relationship Manager" },
  { name: "marketing_head", label: "Marketing Head" },
  { name: "digital_marketing", label: "Digital Marketing" },
  { name: "social_media", label: "Social Media" },
  { name: "content_team", label: "Content Team" },
  { name: "creative_team", label: "Creative Team" },
  { name: "accounts", label: "Accounts" },
  { name: "legal_compliance", label: "Legal" },
  { name: "hr_administration", label: "HR" },
  { name: "technical_support_head", label: "Technical Support Head" },
  { name: "technical_support_team", label: "Technical Support Team" },
];

/**
 * Creates missing hierarchy roles and wires parentRoleId from the canonical map.
 * Safe to call on every assignable/team-directory load (upsert + parent link only).
 */
export const ensureCanonicalHierarchyRoles = async (): Promise<void> => {
  for (const def of HIERARCHY_ROLE_DEFS) {
    await Role.findOneAndUpdate(
      { name: def.name },
      {
        $setOnInsert: {
          name: def.name,
          permissions: [],
          roleType: "system",
          isProtected: false,
          isActive: true,
        },
        $set: {
          label: def.label,
          // Do not force isActive — Super Admin deactivate must stick.
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const names = [
    "super_admin",
    ...HIERARCHY_ROLE_DEFS.map((def) => def.name),
    ...Object.keys(CANONICAL_PARENT_BY_ROLE),
    ...Object.values(CANONICAL_PARENT_BY_ROLE),
  ];
  const roles = await Role.find({ name: { $in: [...new Set(names)] } }).select("_id name").lean();
  const idByName = new Map(roles.map((role) => [role.name, role._id]));

  for (const [childName, parentName] of Object.entries(CANONICAL_PARENT_BY_ROLE)) {
    const childId = idByName.get(canonicalName(childName)) || idByName.get(childName);
    const parentId = idByName.get(canonicalName(parentName)) || idByName.get(parentName);
    if (!childId || !parentId) continue;
    await Role.updateOne({ _id: childId }, { $set: { parentRoleId: parentId } });
  }
};

const STRICT_BRANCH_ROLES: Record<string, Set<string>> = {
  customer_support_head: new Set(["team_lead", "customer_care_executive", "relationship_manager"]),
  team_lead: new Set(["customer_care_executive", "relationship_manager"]),
};

/** Platform end-users shown on User Management for Customer Care / support. */
export const PLATFORM_END_USER_ROLE_NAMES = ["user", "agent", "builder", "builder_staff"] as const;

/**
 * Support-branch roles that query platform end-users.
 * Customer Care Executive is a leaf (no staff descendants), so without this
 * getAllUsers returns an empty $in list and the UI shows 0 users.
 */
const PLATFORM_USER_ACCESS_ROLES = new Set([
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
  "relationship_manager",
  "relationship_managers",
  "team_lead",
  "team_leads",
  "customer_support_team_lead",
  "customer_support_head",
  "technical_support_team",
  "technical_support_head",
]);

/**
 * Map Super Admin–granted module view permissions → platform roles that may be listed.
 * `user:view` unlocks the All Users page (owners + builders + agents).
 * Dedicated builder/agent permissions still grant those roles alone.
 */
const PLATFORM_ROLES_BY_VIEW_PERMISSION: Record<string, readonly string[]> = {
  user: ["user", "builder", "agent", "builder_staff"],
  builder: ["builder", "builder_staff"],
  builder_staff: ["builder_staff"],
  agent: ["agent"],
};

export const platformRoleNamesFromPermissions = (
  permissions: string[] | null | undefined = [],
): string[] => {
  const names = new Set<string>();
  for (const key of permissions || []) {
    const parts = String(key || "")
      .trim()
      .toLowerCase()
      .split(":");
    const moduleName = parts[0] || "";
    const action = parts[1] || "";
    if (!moduleName || action !== "view") continue;
    const roles = PLATFORM_ROLES_BY_VIEW_PERMISSION[moduleName] || [];
    roles.forEach((roleName: string) => {
      names.add(roleName);
    });
  }
  return [...names];
};

const nearestExistingCanonicalParent = (roleName: string, existingNames: Set<string>) => {
  let parent = getCanonicalParentRoleName(roleName);
  const visited = new Set<string>();
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const normalized = canonicalName(parent);
    if (existingNames.has(normalized)) return normalized;
    parent = getCanonicalParentRoleName(parent);
  }
  return null;
};

/**
 * Returns every role below the supplied role, at any depth. The supplied role
 * itself is deliberately excluded: managers administer the teams beneath them.
 */
export const getDescendantRoleIds = async (
  parentRoleId: string | Types.ObjectId,
): Promise<Types.ObjectId[]> => {
  const roles = await Role.find({}).select("_id name parentRoleId").lean();
  const rootId = String(parentRoleId);
  const root = roles.find((role) => String(role._id) === rootId);
  if (!root) return [];
  const strictAllowedRoles = STRICT_BRANCH_ROLES[canonicalName(root.name)] || null;

  const descendants: Types.ObjectId[] = [];
  const seen = new Set([rootId]);
  const existingNames = new Set(roles.map((role) => canonicalName(role.name)));
  let parents = [root];
  while (parents.length) {
    const parentIds = new Set(parents.map((role) => String(role._id)));
    const parentNames = new Set(parents.map((role) => canonicalName(role.name)));
    const children = roles.filter((role) => {
      if (seen.has(String(role._id))) return false;
      const roleCanon = canonicalName(role.name);
      if (strictAllowedRoles && !strictAllowedRoles.has(roleCanon)) return false;

      const nearestParent = nearestExistingCanonicalParent(role.name, existingNames);
      // Canonical parent match (handles operation_head ↔ operations_head and missing/wrong parentRoleId)
      if (nearestParent && parentNames.has(nearestParent)) return true;

      if (role.parentRoleId && parentIds.has(String(role.parentRoleId))) return true;
      return false;
    });
    children.forEach((role) => {
      seen.add(String(role._id));
      descendants.push(role._id);
    });
    parents = children;
  }
  return descendants;
};

const getPlatformEndUserRoleIds = async (): Promise<Types.ObjectId[]> => {
  const roles = await Role.find({ name: { $in: [...PLATFORM_END_USER_ROLE_NAMES] } })
    .select("_id")
    .lean();
  return roles.map((role) => role._id);
};

/**
 * Role IDs this actor may list/search on User Management.
 * - super_admin / admin → null (no role filter)
 * - customer care / support branch → platform end-users (user, agent, builder, builder_staff)
 * - other managers → hierarchy descendants
 *   + platform roles granted via Super Admin permissions (user:view, builder:view, …)
 */
export const resolveVisibleRoleIdsForActor = async (params: {
  actorRoleId?: string | Types.ObjectId | null | undefined;
  actorRoleName?: string | null | undefined;
  permissions?: string[] | null | undefined;
}): Promise<Types.ObjectId[] | null> => {
  const rawRoleName = String(params.actorRoleName || "")
    .trim()
    .toLowerCase();
  const actorRoleName = canonicalName(rawRoleName);

  if (!actorRoleName && !rawRoleName) return [];
  if (
    actorRoleName === "super_admin" ||
    actorRoleName === "admin" ||
    rawRoleName === "super_admin" ||
    rawRoleName === "admin"
  ) {
    return null;
  }

  const canSeePlatformUsers =
    PLATFORM_USER_ACCESS_ROLES.has(actorRoleName) || PLATFORM_USER_ACCESS_ROLES.has(rawRoleName);

  if (canSeePlatformUsers) {
    return getPlatformEndUserRoleIds();
  }

  const permittedPlatformNames = platformRoleNamesFromPermissions(params.permissions);
  const permittedPlatformIds = permittedPlatformNames.length
    ? (
        await Role.find({ name: { $in: permittedPlatformNames } })
          .select("_id")
          .lean()
      ).map((role) => role._id as Types.ObjectId)
    : [];

  const descendantIds = params.actorRoleId
    ? await getDescendantRoleIds(params.actorRoleId)
    : [];

  const merged = new Map<string, Types.ObjectId>();
  [...descendantIds, ...permittedPlatformIds].forEach((id) => {
    merged.set(String(id), id);
  });
  return [...merged.values()];
};
