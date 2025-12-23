// <path>/streamSearchHandler.ts
import type { RequestHandler } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/filters/searchService";
import { sanitizeSearchFilters } from "../services/filters/sanitizeFilters";

const streamSearchHandler: RequestHandler = createStreamingHandler(
  async (filters, batchSize) => {
    // Defensive unwrap: accept { filter: {...} } OR plain {...}
    const actualFilters = (filters as any)?.filter ?? filters ?? {};

    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG streamSearchHandler -> received filters param:", JSON.stringify(filters, null, 2));
      console.log("DEBUG streamSearchHandler -> using actualFilters:", JSON.stringify(actualFilters, null, 2));
    }

    return buildSearchCursor(actualFilters as any);
  },
  {
    batchSize: 100,
    sanitizeFilters: (req) => sanitizeSearchFilters(req),

    initialMeta: (filters) => {
      const actual = (filters as any)?.filter ?? filters ?? {};
      const countable = { ...actual };
      delete (countable as any).skip;
      delete (countable as any).limit;
      delete (countable as any).page;
      delete (countable as any).batchSize;
      delete (countable as any).sort;
      return { filtersApplied: Object.keys(countable).length };
    }
  }
);

export default streamSearchHandler;
