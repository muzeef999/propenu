import { SearchFilters } from "../types/searchResultItem";

export function buildCommonMatch(filters: SearchFilters): Record<string, any> {
  const match: Record<string, any> = {};

  /** Title + City + Location Search */
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    match.$or = [
      { title: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
      { state: { $regex: q, $options: "i" } },
      { pincode: { $regex: q, $options: "i" } },
    ];
  }

  /** OPTIONAL: status */
  if (filters.status) {
    match.status = filters.status;
  }

  /** City filter */
  if (filters.city) {
    match.city = filters.city;
  }

  /** Price range */
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    match.price = {};
    if (filters.minPrice !== undefined) match.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) match.price.$lte = filters.maxPrice;
  }

  /** Bedrooms (Residential Only) */
  if (typeof filters.bedrooms === "number") {
    match.bedrooms = filters.bedrooms;
  }

  return match;
}
