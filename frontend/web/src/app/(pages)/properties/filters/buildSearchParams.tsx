import { FilterState } from "@/types/sharedTypes";

function normalizeFilters(obj: Record<string, any>) {
  const out: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    // ✅ ARRAY → CSV STRING
    if (Array.isArray(value)) {
      out[key] = value.join(",");
      return;
    }

    // ✅ RANGE OBJECT → min/max
    if (typeof value === "object") {
      if (value.min != null) out[`min${capitalize(key)}`] = value.min;
      if (value.max != null) out[`max${capitalize(key)}`] = value.max;
      return;
    }

    // ✅ SIMPLE VALUE
    out[key] = value;
  });

  return out;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildSearchParams(filters: FilterState) {
  const base = {
    category: filters.category,
    listingType: filters.listingTypeValue,
    search: filters.searchText?.trim() || undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
  };

  switch (filters.category) {
    case "Residential":
      return {
        ...base,
        ...normalizeFilters(filters.residential),
      };

    case "Commercial":
      return {
        ...base,
        ...normalizeFilters(filters.commercial),
      };

    case "Land":
      return {
        ...base,
        ...normalizeFilters(filters.land),
      };

    case "Agricultural":
      return {
        ...base,
        ...normalizeFilters(filters.agricultural),
      };

    default:
      return base;
  }
}
