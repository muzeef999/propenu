import { sanitizeWorkingLocations, type WorkingLocationInput } from "./workingLocations";

const CCE_ROLE_NAMES = new Set([
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
]);

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Seed first territory when a CCE account is activated with a home location. */
export function seedWorkingLocationsOnActivate(user: any, location: WorkingLocationInput) {
  const roleName = normalizeRole(user?.roleId?.name || user?.roleName || "");
  if (!CCE_ROLE_NAMES.has(roleName)) return;
  const existing = Array.isArray(user.workingLocations) ? user.workingLocations : [];
  if (existing.length > 0) return;
  const seeded = sanitizeWorkingLocations([location]);
  if (seeded.length) {
    user.workingLocations = seeded;
  }
}
