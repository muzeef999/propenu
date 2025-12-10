// src/services/searchSanitizer.ts
import type {
  RequestQuery,
  ResidentialQuery,
  CommercialQuery,
  LandQuery,
  AgriculturalQuery,
  SearchFilters,
} from "../../types/filterTypes";
import { buildBaseFilters } from "./propertyFilterBuilder";
import { extendResidentialFilters } from "./residentialFilters";
import { extendCommercialFilters } from "./commercialFilters";
import { extendLandFilters } from "./landFilters";
import { extendAgriculturalFilters } from "./agriculturalFilters";
import cleanMatch from "../../utils/cleanMatch";

/**
 * Type-guard: tells TS that the value is a plain object with string keys.
 */
function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v) && (v as any).constructor === Object;
}

/**
 * Shallow-merge helper:
 * - If both sides are plain objects (and not arrays), merge their keys shallowly.
 * - Otherwise, replacer wins (extValue).
 */
function shallowMergeObjects(base: Record<string, any> | undefined, ext: Record<string, any> | undefined): Record<string, any> {
  const out: Record<string, any> = { ...(base ?? {}) };
  const extObj = ext ?? {};
  for (const [k, v] of Object.entries(extObj)) {
    const baseVal = out[k];
    const extVal = v;
    if (isPlainObject(baseVal) && isPlainObject(extVal)) {
      // TypeScript knows baseVal and extVal are Record<string, any> here
      out[k] = { ...baseVal, ...extVal };
    } else {
      out[k] = extVal;
    }
  }
  return out;
}

export function sanitizeSearchFilters(req: RequestQuery<ResidentialQuery>): SearchFilters {
  const { filter: baseFilter, options } = buildBaseFilters(req);

  const pt = (req.query.propertyType as string | undefined) ?? "";
  const types = (pt && pt.split(",").map((s) => s.trim()).filter(Boolean)) ?? [];

  // Start with baseFilter and shallow-merge extender deltas
  let finalFilter: Record<string, any> = { ...(baseFilter ?? {}) };

  if (types.length === 0 || types.includes("Residential")) {
    const ext = extendResidentialFilters(req as RequestQuery<ResidentialQuery>, finalFilter);
    finalFilter = shallowMergeObjects(finalFilter, ext as Record<string, any>);
  }

  if (types.length === 0 || types.includes("Commercial")) {
    const ext = extendCommercialFilters(req as RequestQuery<CommercialQuery>, finalFilter);
    finalFilter = shallowMergeObjects(finalFilter, ext as Record<string, any>);
  }

  if (types.length === 0 || types.includes("Land")) {
    const ext = extendLandFilters(req as RequestQuery<LandQuery>, finalFilter);
    finalFilter = shallowMergeObjects(finalFilter, ext as Record<string, any>);
  }

  if (types.length === 0 || types.includes("Agricultural")) {
    const ext = extendAgriculturalFilters(req as RequestQuery<AgriculturalQuery>, finalFilter);
    finalFilter = shallowMergeObjects(finalFilter, ext as Record<string, any>);
  }

  // CLEAN the final filter to strip empty nested objects / undefined fields
  const cleanedFilter = cleanMatch(finalFilter);

  // Pagination / streaming params (client sends page & batchSize or skip/limit)
  const batchSize = Math.max(1, Math.min(500, Number(req.query.batchSize ?? req.query.limit ?? 50)));
  const page = Math.max(1, Number(req.query.page ?? 1));
  const skip = Number(req.query.skip ?? (page - 1) * batchSize);

  const sf: SearchFilters = {
    filter: cleanedFilter,
    sort: (req.query.sort as string | undefined) ?? undefined,
    propertyType: pt || undefined,
    batchSize,
    page,
    skip,
    ...(options ? { options } : {}),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("DEBUG sanitizeSearchFilters -> baseFilter:", JSON.stringify(baseFilter, null, 2));
    console.log("DEBUG sanitizeSearchFilters -> finalFilter (pre-clean):", JSON.stringify(finalFilter, null, 2));
    console.log("DEBUG sanitizeSearchFilters -> cleanedFilter:", JSON.stringify(cleanedFilter, null, 2));
    console.log("DEBUG sanitizeSearchFilters -> sf:", JSON.stringify(sf, null, 2));
  }

  return sf;
}
