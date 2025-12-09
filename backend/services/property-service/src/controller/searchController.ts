// <path>/streamSearchHandler.ts  (or wherever you create it)
import type { RequestHandler } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/filters/searchService";
import { sanitizeSearchFilters } from "../services/filters/sanitizeFilters";

const streamSearchHandler: RequestHandler = createStreamingHandler(
  async (filters, batchSize) => {
    // <-- DEFENSIVE UNWRAP: accept { filter: {...} } OR plain {...}
    const actualFilters = (filters as any)?.filter ?? filters ?? {};
    return buildSearchCursor(actualFilters as any, batchSize);
  },
  {
    batchSize: 100,
    sanitizeFilters: (req) => sanitizeSearchFilters(req),
    initialMeta: (filters) => {
      const actual = (filters as any)?.filter ?? filters ?? {};
      return { filtersApplied: Object.keys(actual).length };
    }
  }
);

export default streamSearchHandler;
