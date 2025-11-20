// src/services/nominatimService.ts
import { LocationItem, NominatimSearchRaw } from "../types";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = process.env.USER_AGENT || "MyApp/1.0 (contact@example.com)";
const CACHE_TTL_MS = 60_000; // 1 minute (adjust as needed)

const cache = new Map<string, { data: any; expires: number }>();

function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return undefined;
  }
  return hit.data as T;
}

function cacheSet(key: string, data: any, ttl = CACHE_TTL_MS) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const cacheKey = `${url}${opts ? JSON.stringify(opts) : ""}`;
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
      ...(opts?.headers || {}),
    },
    ...opts,
  });

  if (!res.ok)
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as T;
  cacheSet(cacheKey, data);
  return data;
}

/* ---------- utilities ---------- */
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in kilometers */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ---------- Nominatim functions ---------- */
export async function searchLocations(
  q: string,
  limit = 5
): Promise<LocationItem[]> {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=IN&q=${encodeURIComponent(
    q
  )}`;
  const raw = await fetchJson<NominatimSearchRaw[]>(url);

  return raw.map((r) => ({
    id: r.place_id,
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: r.type || null,
    city:
      r.address?.city ||
      r.address?.town ||
      r.address?.village ||
      r.address?.county ||
      null,
    state: r.address?.state || null,
    country: r.address?.country || null,
    postcode: r.address?.postcode || null,
  }));
}

export async function reverseLocation(
  lat: number,
  lon: number
): Promise<LocationItem | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`;
  const r = await fetchJson<any>(url);

  if (!r) return null;

  return {
    id: r.place_id,
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: "reverse",
    city:
      r.address?.city ||
      r.address?.town ||
      r.address?.village ||
      r.address?.county ||
      null,
    state: r.address?.state || null,
    country: r.address?.country || null,
    postcode: r.address?.postcode || null,
  };
}

/* ---------- Overpass nearby (returns distanceKm, sorted, deduped) ---------- */
export async function nearbyCities(
  centerLat: number,
  centerLon: number,
  radiusKm = 100,
  limit = 50
): Promise<Array<LocationItem & { distanceKm: number }>> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const cacheKey = `overpass:${centerLat.toFixed(4)}:${centerLon.toFixed(
    4
  )}:${radiusKm}`;

  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;

  const query = `
[out:json][timeout:25];
(
  node(around:${radiusMeters},${centerLat},${centerLon})[place~"city|town|village"];
  way(around:${radiusMeters},${centerLat},${centerLon})[place~"city|town|village"];
  relation(around:${radiusMeters},${centerLat},${centerLon})[place~"city|town|village"];
);
out center ${limit};
`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "User-Agent": USER_AGENT,
    },
    body: query,
  });

  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const elements = data.elements || [];

  const mapped: Array<LocationItem & { distanceKm: number }> = elements
    .map((el: any) => {
      const pos = el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
      if (!pos) return null;

      const cityName =
        el.tags?.name || el.tags?.["name:en"] || el.tags?.["addr:city"] || null;

      return {
        id: el.id,
        name: cityName || el.tags?.place || `place-${el.id}`,
        lat: Number(pos.lat),
        lon: Number(pos.lon),
        type: el.tags?.place || null,
        city: cityName,
        distanceKm: haversineKm(
          centerLat,
          centerLon,
          Number(pos.lat),
          Number(pos.lon)
        ),
      } as LocationItem & { distanceKm: number };
    })
    .filter(Boolean)
    // keep only inside radius (overpass already filtered by around:, but this is safety)
    .filter((p:any) => p.distanceKm <= radiusKm + 0.0001);

  // dedupe by name + coords
  const seen = new Set<string>();
  const dedup: typeof mapped = [];
  for (const p of mapped) {
    const key = `${(p.name || "").toLowerCase()}|${p.lat.toFixed(
      4
    )}|${p.lon.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(p);
    }
  }

  // sort and limit
  dedup.sort((a, b) => a.distanceKm - b.distanceKm);
  const result = dedup.slice(0, limit);

  // cache result a bit longer than Nominatim results
  cacheSet(cacheKey, result, 1000 * 60 * 5); // 5 minutes
  return result;
}
