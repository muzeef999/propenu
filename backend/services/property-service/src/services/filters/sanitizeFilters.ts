import type { Request } from "express";

/**
 * sanitizeSearchFilters
 * ---------------------
 * This function ONLY:
 * - reads req.query
 * - converts types
 * - passes data forward
 *
 * It does NOT:
 * - apply category logic
 * - apply filters
 */
export function sanitizeSearchFilters(req: Request) {

    console.log("🔥 STEP 1: RAW QUERY =", req.query);

  const q = req.query;

  const filters = {
    // category decides which service runs
    category: q.category as string | undefined,

    bhk: q.bhk ? Number(q.bhk) : undefined,
    batchSize: Math.max(1, Math.min(100, Number(q.batchSize ?? 50))),
  
  };

  console.log("🔥 STEP 2: SANITIZED FILTERS =", filters);


  return filters;
}
