/**
 * Roles that use workingLocations (territories) for geo-scoped work.
 * Same field/shape as CCE — extended to BD / Sales hierarchy.
 */

export const normalizeTerritoryRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Marketplace staff whose territories can be managed / seeded. */
export const TERRITORY_TARGET_ROLES = new Set([
  // Customer Care
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
  "relationship_manager",
  "relationship_managers",
  // BD / Sales hierarchy
  "operations_head",
  "operation_head",
  "business_development_head",
  "regional_manager",
  "regional_managers",
  "business_development_manager",
  "sales_manager",
  "sales_managers",
  "sales_executive",
  "sales_executives",
  "sales_agent",
]);

/** Actors who may manage any territory role globally. */
export const TERRITORY_GLOBAL_MANAGE_ROLES = new Set([
  "super_admin",
  "admin",
  "operations_head",
  "operation_head",
  "customer_support_head",
  "business_development_head",
]);

/** Branch leads who manage descendants via manager chain. */
export const TERRITORY_BRANCH_LEAD_ROLES = new Set([
  "team_lead",
  "team_leads",
  "customer_support_team_lead",
  "customer_support_team_leads",
  "regional_manager",
  "regional_managers",
  "sales_manager",
  "sales_managers",
  "business_development_manager",
]);

export const isTerritoryTargetRole = (roleName?: string) =>
  TERRITORY_TARGET_ROLES.has(normalizeTerritoryRole(roleName));

export const isTerritoryGlobalManager = (roleName?: string) =>
  TERRITORY_GLOBAL_MANAGE_ROLES.has(normalizeTerritoryRole(roleName));

export const isTerritoryBranchLead = (roleName?: string) =>
  TERRITORY_BRANCH_LEAD_ROLES.has(normalizeTerritoryRole(roleName));
