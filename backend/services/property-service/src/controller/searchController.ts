// src/controller/search.controller.ts
import { Request } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/searchService";
import { SearchFilters } from "../types/searchResultItem";

/**
 * Parse and sanitize query params into SearchFilters.
 * Adjust defaults here (propertyType default = "Residential", default sort = "newest").
 *
 * Note: SearchFilters should allow optional fields (q?: string, minPrice?: number, ...).
 * If your SearchFilters expects non-optional fields, either:
 *  - change the type to make fields optional, or
 *  - provide defaults instead of `undefined` below.
 */
function sanitizeFilters(req: Request): SearchFilters {
  const raw = req.query;

  const propertyType = typeof raw.propertyType === "string" && raw.propertyType.trim()
    ? raw.propertyType
    : "Residential"; // default

  const q = typeof raw.q === "string" ? raw.q : undefined;
  const minPrice = raw.minPrice ? Number(raw.minPrice) : undefined;
  const maxPrice = raw.maxPrice ? Number(raw.maxPrice) : undefined;
  const city = typeof raw.city === "string" ? raw.city : undefined;
  const sort = typeof raw.sort === "string" ? (raw.sort as any) : "newest";

  // Return typed object. If your SearchFilters has required properties, change types accordingly.
  return {
    propertyType,
    q,
    minPrice,
    maxPrice,
    city,
    sort
  } as SearchFilters;
}

/**
 * Create the streaming handler by calling the factory with:
 * - a cursorBuilder (buildSearchCursor)
 * - options (including the sanitizeFilters function)
 */
const streamSearchHandler = createStreamingHandler<SearchFilters>(
  // cursorBuilder: receives sanitized filters and returns a cursor
  async (filters, batchSize) => buildSearchCursor(filters, batchSize),
  {
    batchSize: 150,
    maxItems: 10000,
    sanitizeFilters, // <-- function defined above (no more "not in scope" error)
    allowedSorts: new Set(["newest", "price_asc", "price_desc"]),
    initialMeta: (f) => ({ startedAt: new Date().toISOString(), defaultsApplied: { propertyType: f.propertyType } }),
    onError: (err) => console.error("streamSearch error:", err)
  }
);

export default streamSearchHandler;
