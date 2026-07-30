/**
 * Working territories for Customer Care Executives (property-service copy).
 * Empty city => whole state; empty locality => whole city.
 */

export type WorkingLocationInput = {
  state?: string | undefined;
  city?: string | undefined;
  locality?: string | undefined;
};

export type WorkingLocation = {
  state: string;
  city?: string | undefined;
  locality?: string | undefined;
};

export const normalizeLocPart = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const STATE_ALIASES: Record<string, string> = {
  ap: "andhra pradesh",
  "andhra pradesh": "andhra pradesh",
  "andhra-pradesh": "andhra pradesh",
  tg: "telangana",
  ts: "telangana",
  telangana: "telangana",
};

export const normalizeState = (value?: string | null) => {
  const raw = normalizeLocPart(value);
  if (!raw) return "";
  return STATE_ALIASES[raw] || raw;
};

export const cleanLocDisplay = (value?: string | null) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

export function sanitizeWorkingLocations(
  rows: WorkingLocationInput[] | undefined | null,
): WorkingLocation[] {
  if (!Array.isArray(rows)) return [];

  const seen = new Set<string>();
  const out: WorkingLocation[] = [];

  for (const row of rows) {
    const state = cleanLocDisplay(row?.state);
    if (!state) continue;
    const city = cleanLocDisplay(row?.city) || undefined;
    const locality = city ? cleanLocDisplay(row?.locality) || undefined : undefined;
    const key = `${normalizeState(state)}|${normalizeLocPart(city)}|${normalizeLocPart(locality)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      state,
      ...(city ? { city } : {}),
      ...(locality ? { locality } : {}),
    });
  }

  return out;
}

export function territoryCovers(
  territory: WorkingLocationInput,
  target: WorkingLocationInput,
): boolean {
  const tState = normalizeState(territory.state);
  const aState = normalizeState(target.state);
  if (!tState || !aState || tState !== aState) return false;

  const tCity = normalizeLocPart(territory.city);
  if (!tCity) return true;

  const aCity = normalizeLocPart(target.city);
  if (!aCity || tCity !== aCity) return false;

  const tLoc = normalizeLocPart(territory.locality);
  if (!tLoc) return true;

  const aLoc = normalizeLocPart(target.locality);
  return Boolean(aLoc && tLoc === aLoc);
}

export function anyTerritoryCovers(
  territories: WorkingLocationInput[] | undefined | null,
  target: WorkingLocationInput,
): boolean {
  if (!Array.isArray(territories) || !territories.length) return false;
  return territories.some((row) => territoryCovers(row, target));
}
