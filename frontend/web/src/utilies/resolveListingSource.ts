export type CanonicalListingSource = "User" | "Agent" | "builder";

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export function resolveListingSource(
  listingSource?: unknown,
  createdBy?: Record<string, unknown>,
): CanonicalListingSource {
  const candidates = [
    createdBy?.roleName,
    createdBy?.role,
    createdBy?.userType,
    createdBy?.accountType,
    createdBy?.source,
    listingSource,
    createdBy?.name,
  ];

  for (const candidate of candidates) {
    const value = normalize(candidate);
    if (!value) continue;

    if (value.includes("agent")) return "Agent";
    if (value.includes("builder")) return "builder";
    if (
      value.includes("owner") ||
      value.includes("user") ||
      value.includes("seller")
    ) {
      return "User";
    }
  }

  return "User";
}

export function listingSourceToOwnershipLabel(
  listingSource?: unknown,
  createdBy?: Record<string, unknown>,
) {
  const resolved = resolveListingSource(listingSource, createdBy);
  if (resolved === "Agent") return "Agent";
  if (resolved === "builder") return "Builder";
  return "Owner";
}
