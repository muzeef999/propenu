import type { RequestHandler } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/filters/searchService";
import { sanitizeSearchFilters } from "../services/filters/sanitizeFilters";

const streamSearchHandler: RequestHandler = createStreamingHandler(
  async (filters, batchSize) => {
    // buildSearchCursor expects SearchFilters; if sanitizeSearchFilters already built the shape,
    // createStreamingHandler will call this with that object. But here we will pass through.
    return buildSearchCursor(filters as any, batchSize);
  },
  {
    batchSize: 100,
    sanitizeFilters: (req) => sanitizeSearchFilters(req),
    // allowedSorts: new Set(["price_asc","price_desc","createdAt"]), // optional
    initialMeta: (filters) => ({ filtersApplied: Object.keys((filters as any).filter || {})?.length ?? 0 })
  }
);

export default streamSearchHandler;
