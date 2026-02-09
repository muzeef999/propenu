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

function mapCsv(value: unknown, mapFn: (token: string) => string) {
  if (typeof value !== "string") return value;
  return value
    .split(",")
    .map((v) => mapFn(v.trim()))
    .filter(Boolean)
    .join(",");
}

function normalizeCommercialTypeToken(token: string) {
  return token.toLowerCase().replace(/[\s-]+/g, "");
}

function normalizeCommercialSubTypeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
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
      {
        const normalized = normalizeFilters(filters.commercial);

        if (normalized.commercialType !== undefined) {
          normalized.propertyType = mapCsv(
            normalized.commercialType,
            normalizeCommercialTypeToken
          );
          delete normalized.commercialType;
        }

        if (normalized.commercialSubType !== undefined) {
          normalized.propertySubType = mapCsv(
            normalized.commercialSubType,
            normalizeCommercialSubTypeToken
          );
          delete normalized.commercialSubType;
        }

        if (normalized.furnishingStatus !== undefined) {
          normalized.furnishedStatus = normalized.furnishingStatus;
          delete normalized.furnishingStatus;
        }

        return {
          ...base,
          ...normalized,
        };
      }

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
