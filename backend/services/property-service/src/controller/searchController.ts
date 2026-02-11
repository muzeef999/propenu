// src/controller/streamSearchHandler.ts

import type { RequestHandler } from "express";
import createStreamingHandler from "../factory/streamingFactory";
import buildSearchCursor from "../services/filters/searchService";
import { sanitizeSearchFilters } from "../services/filters/sanitizeFilters";
import { CATEGORY_SERVICE_MAP } from "../services/filters/searchService";

/**
 * Count applied filters safely
 * - ignores undefined / null
 * - handles nested objects (ranges)
 */
function countAppliedFilters(filters: Record<string, any>): number {
  let count = 0;

  for (const value of Object.values(filters)) {
    if (value === undefined || value === null) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      count += Object.keys(value).length;
    } else {
      count += 1;
    }
  }

  return count;
}

/**
 * STREAM SEARCH HANDLER (DO NOT RENAME / DO NOT REMOVE)
 */
const streamSearchHandler: RequestHandler = createStreamingHandler(
  // 🔹 STEP 3: Build cursor
  async (filters) => {
    return buildSearchCursor(filters);
  },
  {
    batchSize: 100,

    // 🔹 STEP 1 & 2: Sanitize filters
    sanitizeFilters: (req) => {
      


      const sanitized = sanitizeSearchFilters(req);

      if (process.env.NODE_ENV !== "production") {
        console.log("🔥 STEP 2: SANITIZED FILTERS =", sanitized);
      }

      return sanitized;
    },

    // 🔹 Meta info (filter count, category validation)
    initialMeta: async (filters) => {
  const actual = (filters as any)?.filter ?? filters ?? {};
  const category = actual.category;

  if (!category) {
    throw new Error("Category filter is required for search");
  }

  const service = CATEGORY_SERVICE_MAP[category];
  if (!service) {
    return { total: 0 };
  }

  const pipeline = service.getPipeline(actual);

  const matchStage = pipeline.find((stage: any) => stage.$match);
  const match = matchStage ? matchStage.$match : {};

  const total = await service.model.countDocuments(match);

  return { total };
},

  }
);

// ✅ DEFAULT EXPORT (THIS FIXES YOUR TS ERROR)
export default streamSearchHandler;
