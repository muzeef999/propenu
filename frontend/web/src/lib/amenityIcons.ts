// lib/amenityIcons.ts
export function amenityTitleToIconPath(title?: string) {
  if (!title) return "/icons/amenities/default.svg";
  // normalize: "Swimming Pool" -> "swimming_pool"
  const key = title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const path = `/icons/amenities/${key}.svg`;
  // Optionally check if file exists server-side and fallback; on client just try path
  return path;
}
