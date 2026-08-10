/**
 * Person-level reporting (User.managerId) by role.
 * Matches the canonical org tree used by roleHierarchy.ts.
 */

const ROLE_ALIASES: Record<string, string> = {
  operation_head: "operations_head",
  team_lead: "customer_support_team_lead",
  team_leads: "customer_support_team_lead",
  customer_support_team_leads: "customer_support_team_lead",
  customer_care: "customer_care_executive",
  customer_care_executives: "customer_care_executive",
  relationship_managers: "relationship_manager",
  sales_executives: "sales_executive",
  sales_agent: "sales_executive",
  accounts_finance: "accounts",
  hr: "hr_administration",
  hr_admin: "hr_administration",
  human_resources: "hr_administration",
  legal: "legal_compliance",
  legal_and_compliance: "legal_compliance",
  compliance: "legal_compliance",
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
  customer_support_team_lead: "customer_support_head",
  customer_care_executive: "customer_support_team_lead",
  relationship_manager: "customer_support_team_lead",
  marketing_head: "operations_head",
  digital_marketing: "marketing_head",
  social_media: "digital_marketing",
  content_team: "digital_marketing",
  creative_team: "digital_marketing",
  performance_marketing: "digital_marketing",
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
  // Public marketplace users can be owned/followed by field SE staff
  user: ["sales_executive", "sales_agent", "sales_manager", "regional_manager"],
  customer_support_head: ["operations_head"],
  customer_support_team_lead: ["customer_support_head"],
  customer_care_executive: ["customer_support_team_lead"],
  relationship_manager: ["customer_support_team_lead"],
  marketing_head: ["operations_head"],
  digital_marketing: ["marketing_head"],
  // Preferred parent first; Marketing Head is skip-level fallback until a DM person exists.
  social_media: ["digital_marketing", "marketing_head"],
  content_team: ["digital_marketing", "marketing_head"],
  creative_team: ["digital_marketing", "marketing_head"],
  performance_marketing: ["digital_marketing", "marketing_head"],
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
  customer_support_head: ["customer_support_team_lead"],
  customer_support_team_lead: ["customer_care_executive", "relationship_manager"],
  marketing_head: ["digital_marketing"],
  digital_marketing: [
    "social_media",
    "content_team",
    "creative_team",
    "performance_marketing",
  ],
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

/** Expand canonical reports-to roles to include DB alias names (legacy seeds). */
export const expandReportsToRoleNames = (roleNames: string[] = []): string[] => {
  const ALIASES: Record<string, string[]> = {
    customer_support_team_lead: [
      "customer_support_team_lead",
      "customer_support_team_leads",
      "team_lead",
      "team_leads",
    ],
    team_lead: [
      "customer_support_team_lead",
      "customer_support_team_leads",
      "team_lead",
      "team_leads",
    ],
    customer_support_head: ["customer_support_head"],
    operations_head: ["operations_head", "operation_head"],
    business_development_head: ["business_development_head"],
    regional_manager: ["regional_manager", "regional_managers"],
    sales_manager: ["sales_manager"],
    marketing_head: ["marketing_head"],
    digital_marketing: ["digital_marketing"],
    social_media: ["social_media"],
    content_team: ["content_team"],
    creative_team: ["creative_team"],
    performance_marketing: ["performance_marketing"],
    technical_support_head: ["technical_support_head"],
    super_admin: ["super_admin"],
    customer_care_executive: [
      "customer_care_executive",
      "customer_care_executives",
      "customer_care",
    ],
    relationship_manager: ["relationship_manager", "relationship_managers"],
    sales_executive: ["sales_executive", "sales_executives", "sales_agent"],
  };

  return [
    ...new Set(
      roleNames.flatMap((name) => {
        const key = canonicalRoleName(name);
        return ALIASES[key] || [key || name];
      }),
    ),
  ].filter(Boolean);
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
