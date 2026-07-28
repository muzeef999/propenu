const OPERATIONS_HEAD_ROLES = new Set(["operations_head", "operation_head"]);

// Transitional hierarchy for the Operations Head slice. These names include
// current seeded roles and the role keys generated from the organisation chart.
export const OPERATIONS_MANAGED_ROLE_NAMES = new Set([
  "business_development_head",
  "regional_manager",
  "regional_managers",
  "business_development_manager",
  "sales_manager",
  "sales_executive",
  "sales_executives",
  "sales_agent",
  "customer_support_head",
  "team_lead",
  "customer_care_executive",
  "customer_care",
  "relationship_manager",
  "relationship_managers",
  "marketing_head",
  "digital_marketing",
  "social_media",
  "content_team",
  "creative_team",
  "accounts_finance",
  "accounts",
  "legal_compliance",
  "hr_administration",
  "technical_support_head",
  "technical_support_team",
]);

export const BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES = new Set([
  "regional_manager", "regional_managers", "business_development_manager",
  "sales_manager", "sales_executive", "sales_executives", "sales_agent",
]);

export const REGIONAL_MANAGER_MANAGED_ROLE_NAMES = new Set([
  "sales_manager", "sales_executive", "sales_executives", "sales_agent",
  "relationship_manager", "relationship_managers",
]);

export const getLegacyManagedRoleNames = (actorRoleName?: string | null) => {
  if (!actorRoleName) return null;
  if (OPERATIONS_HEAD_ROLES.has(actorRoleName)) return OPERATIONS_MANAGED_ROLE_NAMES;
  if (actorRoleName === "business_development_head") return BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES;
  if (actorRoleName === "regional_manager") return REGIONAL_MANAGER_MANAGED_ROLE_NAMES;
  return null;
};

export const canAssignDashboardRole = (
  actorRoleName?: string | null,
  targetRoleName?: string | null,
) => {
  if (!actorRoleName || !targetRoleName) return false;
  if (actorRoleName === "super_admin") return true;
  if (OPERATIONS_HEAD_ROLES.has(actorRoleName)) {
    return OPERATIONS_MANAGED_ROLE_NAMES.has(targetRoleName);
  }
  if (actorRoleName === "business_development_head") {
    return BUSINESS_DEVELOPMENT_MANAGED_ROLE_NAMES.has(targetRoleName);
  }
  if (actorRoleName === "regional_manager") {
    return REGIONAL_MANAGER_MANAGED_ROLE_NAMES.has(targetRoleName);
  }
  return false;
};
