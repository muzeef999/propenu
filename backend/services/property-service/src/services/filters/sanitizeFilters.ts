// src/services/searchSanitizer.ts (or where sanitizeSearchFilters lives)
import type { RequestQuery, ResidentialQuery, CommercialQuery, LandQuery, AgriculturalQuery, SearchFilters } from "../../types/filterTypes";
import { buildBaseFilters } from "./propertyFilterBuilder";
import { extendResidentialFilters } from "./residentialFilters";
import { extendCommercialFilters } from "./commercialFilters";
import { extendLandFilters } from "./landFilters";
import { extendAgriculturalFilters } from "./agriculturalFilters";
import cleanMatch from "../../utils/cleanMatch";

export function sanitizeSearchFilters(req: RequestQuery<ResidentialQuery>): SearchFilters {
  const { filter: baseFilter, options } = buildBaseFilters(req);

  const pt = (req.query.propertyType as string | undefined) ?? "";
  const types = (pt && pt.split(",").map(s => s.trim()).filter(Boolean)) ?? [];

  let finalFilter = { ...baseFilter };

  if (types.length === 0 || types.includes("Residential")) {
    finalFilter = { ...finalFilter, ...extendResidentialFilters(req as RequestQuery<ResidentialQuery>, finalFilter) };
  }

  if (types.length === 0 || types.includes("Commercial")) {
    finalFilter = { ...finalFilter, ...extendCommercialFilters(req as RequestQuery<CommercialQuery>, finalFilter) };
  }

  if (types.length === 0 || types.includes("Land")) {
    finalFilter = { ...finalFilter, ...extendLandFilters(req as RequestQuery<LandQuery>, finalFilter) };
  }

  if (types.length === 0 || types.includes("Agricultural")) {
    finalFilter = { ...finalFilter, ...extendAgriculturalFilters(req as RequestQuery<AgriculturalQuery>, finalFilter) };
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


  return sf;
}
