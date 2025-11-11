import { LocationItem, NominatimSearchRaw } from "../types";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.USER_AGENT || "MyApp/1.0 (contact unknown)";
const CACHE_TTL_MS = 60_000; // 1 minute

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

function cacheSet(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

async function fetchJson<T>(url: string): Promise<T> {
  const cached = cacheGet<T>(url);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
  });

  if (!res.ok) throw new Error("Nominatim request failed");

  const data = (await res.json()) as T;
  cacheSet(url, data);
  return data;
}

export async function searchLocations(q: string, limit = 5): Promise<LocationItem[]> {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}`;
  const raw = await fetchJson<NominatimSearchRaw[]>(url);

  return raw.map((r) => ({
    id: r.place_id,
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: r.type || null,
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || null,
    state: r.address?.state || null,
    country: r.address?.country || null,
    postcode: r.address?.postcode || null,
  }));
}

export async function reverseLocation(lat: number, lon: number): Promise<LocationItem | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`;
  const r = await fetchJson<any>(url);

  if (!r) return null;

  return {
    id: r.place_id,
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: "reverse",
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || null,
    state: r.address?.state || null,
    country: r.address?.country || null,
    postcode: r.address?.postcode || null,
  };
}
