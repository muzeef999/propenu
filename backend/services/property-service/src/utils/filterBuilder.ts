import { SearchFilters } from "../types/searchResultItem";

export function buildCommonMatch(filters: SearchFilters): Record<string, any> {
  const match: Record<string, any> = {};

  /** Title search */
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.title = { $regex: q, $options: "i" };
  }

  /** OPTIONAL: status (do not force ACTIVE) */
  if (filters.status) {
    match.status = filters.status; // or case-insensitive if needed
  }

  /** City */
  if (filters.city) {
    match.city = filters.city;
  }

  /** Price */
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    match.price = {};
    if (filters.minPrice !== undefined) match.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) match.price.$lte = filters.maxPrice;
  }

  /** Bedrooms */
  if (typeof filters.bedrooms === "number") {
    match.bedrooms = filters.bedrooms;
  }

  return match;
}
