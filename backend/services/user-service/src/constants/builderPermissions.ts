export const BUILDER_STAFF_ROLE_NAME = "builder_staff";

export const BUILDER_PERMISSION_KEYS = [
  "project:view",
  "project:create",
  "project:update",
  "project:delete",
  "lead:view",
  "lead:create",
  "lead:update",
  "lead:delete",
  "lead:assign",
  "lead:import",
  "lead:download",
  "team:view",
  "team:create",
  "team:update",
  "team:delete",
  "role:view",
  "role:create",
  "role:update",
  "role:delete",
] as const;

export const BUILDER_PERMISSION_SET = new Set<string>(BUILDER_PERMISSION_KEYS);
