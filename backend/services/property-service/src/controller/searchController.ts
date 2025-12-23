// src/controller/streamSearchHandler.ts

import type { RequestHandler } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/filters/searchService";
import { sanitizeSearchFilters } from "../services/filters/sanitizeFilters";
import { CATEGORY_SERVICE_MAP} from "../services/filters/searchService";

/**
 * Count applied filters safely
 * - ignores undefined / null
 * - handles nested objects (ranges)
 */
function countAppliedFilters(filters: Record<string, any>): number {
  let count = 0;

  for (const value of Object.values(filters)) {
    if (value === undefined || value === null) continue;

    // nested object (price, area, etc.)
    if (typeof value === "object" && !Array.isArray(value)) {
      count += Object.keys(value).length;
    } else {
      count += 1;
    }
  }

  return count;
}

const streamSearchHandler: RequestHandler = createStreamingHandler(
  async (filters) => {
    const actualFilters = (filters as any)?.filter ?? filters ?? {};

    if (process.env.NODE_ENV !== "production") {
      console.log("🔥 STEP 3: buildSearchCursor filters =", actualFilters);
    }

    return buildSearchCursor(actualFilters);
  },
  {
    batchSize: 100,

    sanitizeFilters: (req) => {
      console.log("🔥 STEP 1: RAW QUERY =", req.query);
      const sanitized = sanitizeSearchFilters(req);
      console.log("🔥 STEP 2: SANITIZED FILTERS =", sanitized);
      return sanitized;
    },

    initialMeta: (filters) => {
      const actual = (filters as any)?.filter ?? filters ?? {};
     const category =  actual.category;

     if(!category){
      throw new Error("Category filter is required for search");
     }

       const filterBuilder = CATEGORY_SERVICE_MAP[category];

       if (!filterBuilder) {
    return { filtersApplied: 0 };
  }


  const match = filterBuilder(actual, {});

  const filtersApplied = countAppliedFilters(match);

  console.log("🔥 CATEGORY:", category);
  console.log("🔥 MATCH OBJECT:", match);
  console.log("🔥 FILTERS APPLIED:", filtersApplied);

   
      return {
        filtersApplied,
      };
    },
  }
);

export default streamSearchHandler;
