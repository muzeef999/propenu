import type { Request } from "express";
import { AgriculturalQuery, CommercialQuery, LandQuery, RequestQuery, ResidentialQuery, SearchFilters } from "../../types/filterTypes";
import { buildBaseFilters } from "./propertyFilterBuilder";
import { extendResidentialFilters } from "./residentialFilters";
import { extendCommercialFilters } from "./commercialFilters";
import { extendLandFilters } from "./landFilters";
import { extendAgriculturalFilters } from "./agriculturalFilters";

/**
 * Map incoming req -> SearchFilters used by buildSearchCursor
 */
export function sanitizeSearchFilters(req: Request): SearchFilters {
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

  // Build and return SearchFilters (your buildSearchCursor expects this shape)
  const sf: SearchFilters = {
    filter: finalFilter,
    sort: (req.query.sort as string | undefined) ?? undefined,
    propertyType: pt || undefined,
    batchSize: Number(req.query.batchSize ?? 50),
    // include options from buildBaseFilters if you want (skip/limit etc)
    ...(options ? { options } : {}),
  };

  return sf;
}
