// src/services/filters/sanitizeFilters.ts

const ALLOWED_FILTERS = [
  "category",
  "search",
  "listingType",
  "listingSource",
  "transactionType",
  "city",
  "furnishing",
  "constructionStatus",
  "propertyType",

  // numeric filters
  "bhk",
  "minPrice",
  "maxPrice",

  // infra
  "batchSize",
];

const NUMERIC_FILTERS = new Set([
  "bhk",
  "minPrice",
  "maxPrice",
  "batchSize",
]);

export function sanitizeSearchFilters(req: any) {
  const filter: any = {};
  let batchSize = 50;

  for (const key of ALLOWED_FILTERS) {
    const value = req.query[key];

    if (value === undefined || value === null || value === "") continue;

    if (NUMERIC_FILTERS.has(key)) {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        filter[key] = num;
      }
    } else {
      filter[key] = String(value);
    }
  }

  if (req.query.batchSize) {
    const num = Number(req.query.batchSize);
    if (!Number.isNaN(num)) {
      batchSize = num;
    }
  }

  // ✅ THIS SHAPE IS REQUIRED
  return {
    filter,
    batchSize,
  };
}
