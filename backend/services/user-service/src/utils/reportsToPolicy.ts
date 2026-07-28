/**
 * Person-level reporting (User.managerId) by role.
 * Matches the canonical org tree used by roleHierarchy.ts.
 */

const ROLE_ALIASES: Record<string, string> = {
  operation_head: "operations_head",
  customer_support_team_lead: "team_lead",
  team_leads: "team_lead",
  customer_care: "customer_care_executive",
  customer_care_executives: "customer_care_executive",
  relationship_managers: "relationship_manager",
  sales_executives: "sales_executive",
  sales_agent: "sales_executive",
  accounts_finance: "accounts",
};

/** Canonical org parent chain (above). */
const ORG_PARENT_BY_ROLE: Record<string, string> = {
  ceo: "super_admin",
  founder: "super_admin",
  operations_head: "super_admin",
  business_development_head: "operations_head",
  regional_manager: "business_development_head",
  business_development_manager: "regional_manager",
  sales_manager: "regional_manager",
  sales_executive: "regional_manager",
  customer_support_head: "operations_head",
  team_lead: "customer_support_head",
  customer_care_executive: "team_lead",
  relationship_manager: "team_lead",
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

/**
 * Who a person in `role` may report to (person picker options).
 * First entry = preferred / primary.
 */
const REPORTS_TO_ROLE_OPTIONS: Record<string, string[]> = {
  ceo: ["super_admin"],
  founder: ["super_admin"],
  operations_head: ["super_admin"],
  business_development_head: ["operations_head"],
  regional_manager: ["business_development_head"],
  business_development_manager: ["regional_manager"],
  sales_manager: ["regional_manager"],
  sales_executive: ["sales_manager", "regional_manager"],
  sales_agent: ["sales_manager", "regional_manager"],
  customer_support_head: ["operations_head"],
  team_lead: ["customer_support_head"],
  customer_care_executive: ["team_lead"],
  relationship_manager: ["team_lead"],
  marketing_head: ["operations_head"],
  digital_marketing: ["marketing_head"],
  social_media: ["marketing_head"],
  content_team: ["marketing_head"],
  creative_team: ["marketing_head"],
  accounts: ["operations_head"],
  accounts_finance: ["operations_head"],
  legal_compliance: ["operations_head"],
  hr_administration: ["operations_head"],
  technical_support_head: ["operations_head"],
  technical_support_team: ["technical_support_head"],
};

/** Direct children in the org tree (below). */
const ORG_CHILDREN_BY_ROLE: Record<string, string[]> = {
  super_admin: ["ceo", "operations_head"],
  operations_head: [
    "business_development_head",
    "customer_support_head",
    "marketing_head",
    "accounts",
    "legal_compliance",
    "hr_administration",
    "technical_support_head",
  ],
  business_development_head: ["regional_manager"],
  regional_manager: [
    "business_development_manager",
    "sales_executive",
    "sales_agent",
    "sales_manager",
  ],
  sales_manager: ["sales_agent", "sales_executive"],
  customer_support_head: ["team_lead"],
  team_lead: ["customer_care_executive", "relationship_manager"],
  marketing_head: ["digital_marketing", "social_media", "content_team", "creative_team"],
  technical_support_head: ["technical_support_team"],
};

export const canonicalRoleName = (roleName?: string | null) => {
  const raw = String(roleName || "")
    .trim()
    .toLowerCase();
  return ROLE_ALIASES[raw] || raw;
};

export const getReportsToRoleOptions = (roleName?: string | null): string[] => {
  const key = canonicalRoleName(roleName);
  return REPORTS_TO_ROLE_OPTIONS[key] ? [...REPORTS_TO_ROLE_OPTIONS[key]] : [];
};

export const getPreferredReportsToRole = (roleName?: string | null): string | null => {
  const options = getReportsToRoleOptions(roleName);
  return options[0] || null;
};

export const canReportToRole = (
  reportRoleName?: string | null,
  managerRoleName?: string | null,
): boolean => {
  const report = canonicalRoleName(reportRoleName);
  const manager = canonicalRoleName(managerRoleName);
  if (!report || !manager) return false;
  return getReportsToRoleOptions(report).includes(manager);
};

export const getOrgRolesAbove = (roleName?: string | null): string[] => {
  const chain: string[] = [];
  let current = canonicalRoleName(roleName);
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const parent = ORG_PARENT_BY_ROLE[current];
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
};

export const getOrgRolesBelow = (roleName?: string | null): string[] => {
  const root = canonicalRoleName(roleName);
  if (!root) return [];
  const out: string[] = [];
  const seen = new Set<string>([root]);
  let frontier = [root];
  while (frontier.length) {
    const next: string[] = [];
    for (const role of frontier) {
      const children = ORG_CHILDREN_BY_ROLE[role] || [];
      for (const child of children) {
        const name = canonicalRoleName(child);
        if (!name || seen.has(name)) continue;
        seen.add(name);
        out.push(name);
        next.push(name);
      }
    }
    frontier = next;
  }
  return out;
};

export const describeRoleHierarchy = (roleName?: string | null) => {
  const role = canonicalRoleName(roleName);
  return {
    role,
    above: getOrgRolesAbove(role),
    below: getOrgRolesBelow(role),
    reportsToRoles: getReportsToRoleOptions(role),
    preferredReportsToRole: getPreferredReportsToRole(role),
  };
};
