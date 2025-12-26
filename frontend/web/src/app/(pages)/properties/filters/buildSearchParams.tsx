import { FilterState } from "@/types/sharedTypes";

export function buildSearchParams(filters: FilterState) {
  const base = {
    category: filters.category,
    listingType: filters.listingType,
    search: filters.searchText?.trim() || undefined,
    minBudget: filters.minBudget,
    maxBudget: filters.maxBudget,
  };

  switch (filters.category) {
    case "Residential":
      return {
        ...base,
        ...filters.residential,
      };

    case "Commercial":
      return {
        ...base,
        ...filters.commercial,
      };

    case "Land":
      return {
        ...base,
        ...filters.land,
      };

    case "Agricultural":
      return {
        ...base,
        ...filters.agricultural,
      };

    default:
      return base;
  }
}
