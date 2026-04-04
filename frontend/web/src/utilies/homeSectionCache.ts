"use client";

const homeSectionCache = new Map<string, unknown>();

export function getHomeSectionCache<T>(key: string) {
  return homeSectionCache.get(key) as T | undefined;
}

export function setHomeSectionCache<T>(key: string, value: T) {
  homeSectionCache.set(key, value);
}

export function getHomeSectionCacheKey(section: string, params?: {
  state?: string;
  city?: string;
}) {
  const state = params?.state?.trim().toLowerCase() ?? "all-states";
  const city = params?.city?.trim().toLowerCase() ?? "all-cities";

  return `${section}:${state}:${city}`;
}
