import { sanitizeWorkingLocations, type WorkingLocationInput } from "./workingLocations";
import { isTerritoryTargetRole } from "./territoryRoles";

/** Seed first territory when a hierarchy field role is activated with a home location. */
export function seedWorkingLocationsOnActivate(user: any, location: WorkingLocationInput) {
  const roleName = user?.roleId?.name || user?.roleName || "";
  if (!isTerritoryTargetRole(roleName)) return;
  const existing = Array.isArray(user.workingLocations) ? user.workingLocations : [];
  if (existing.length > 0) return;
  const seeded = sanitizeWorkingLocations([location]);
  if (seeded.length) {
    user.workingLocations = seeded;
  }
}
