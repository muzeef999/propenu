// src/services/search.service.ts
import { PropertyType, SearchFilters } from "../../types/searchResultItem";
import AgriculturalService from "../agriculturalServices";
import CommercialService from "../commercialService";
import LandService from "../landService";
import ResidentialPropertyService from "../residentialServices";

type ServiceObj = { model: any; getPipeline: (filters: SearchFilters) => any[] };

const TYPE_MAP: Record<PropertyType, ServiceObj> = {
  Residential: ResidentialPropertyService as unknown as ServiceObj,
  Commercial: CommercialService as unknown as ServiceObj,
  Land: LandService as unknown as ServiceObj,
  Agricultural: AgriculturalService as unknown as ServiceObj,
};

function normalizeTypes(propertyTypeQuery?: string): PropertyType[] {
  if (!propertyTypeQuery) return Object.keys(TYPE_MAP) as PropertyType[];
  return propertyTypeQuery.split(",").map((s) => s.trim()).filter(Boolean) as PropertyType[];
}

/**
 * Build a robust AsyncIterableIterator cursor for the combined search pipeline.
 * This handles differences between Mongoose versions & driver cursors.
 */
export default async function buildSearchCursor(
  filters: SearchFilters,
  batchSize = 50,
  useEstimatePrimary = false
): Promise<AsyncIterableIterator<any>> {
  const selected = normalizeTypes(filters.propertyType);
  if (selected.length === 0) throw new Error("No property types selected");

  const primaryType = selected[0]!; // safe after check
  const primaryService = TYPE_MAP[primaryType];
  if (!primaryService) throw new Error("Invalid primary type");

  // Build pipeline: primary pipeline + $unionWith others
  const pipeline: any[] = [];
  pipeline.push(...primaryService.getPipeline(filters));

  for (const t of selected) {
    if (t === primaryType) continue;
    const svc = TYPE_MAP[t];
    if (!svc) continue;
    pipeline.push({
      $unionWith: {
        coll: svc.model.collection.name,
        pipeline: svc.getPipeline(filters),
      },
    });
  }

  // Global sort
  let sortStage: any = { createdAt: -1 };
  if (filters.sort === "price_asc") sortStage = { price: 1 };
  else if (filters.sort === "price_desc") sortStage = { price: -1 };
  pipeline.push({ $sort: sortStage });

  // Debug logs — helpful during development. Remove or lower-level in prod.
  // console.log("searchService.buildSearchCursor - selected:", selected);
  // console.log("searchService.buildSearchCursor - pipeline:", JSON.stringify(pipeline, null, 2));

  // --- Create cursor robustly ---
  try {
    const agg = primaryService.model.aggregate(pipeline as any);

    // 1) Preferred: agg.cursor({ batchSize }) may return a cursor or an object exposing exec()
    const hasCursorFn = typeof (agg as any).cursor === "function";
    if (hasCursorFn) {
      const maybeCursor = (agg as any).cursor({ batchSize });

      // If exec exists (older Mongoose patterns), call it
      if (maybeCursor && typeof maybeCursor.exec === "function") {
        const executed = (maybeCursor as any).exec();
        if (executed && typeof executed[Symbol.asyncIterator] === "function") {
          return executed as AsyncIterableIterator<any>;
        }
      }

      // If the returned object is already async-iterable, return it
      if (maybeCursor && typeof (maybeCursor as any)[Symbol.asyncIterator] === "function") {
        return maybeCursor as AsyncIterableIterator<any>;
      }

      // If it exposes stream(), convert stream to async iterator if possible
      if (maybeCursor && typeof (maybeCursor as any).stream === "function") {
        const stream = (maybeCursor as any).stream();
        if (stream && typeof (stream as any)[Symbol.asyncIterator] === "function") {
          return (stream as any)[Symbol.asyncIterator]() as AsyncIterableIterator<any>;
        }
      }
    }

    // 2) Fallback: use native collection.aggregate with cursor option (driver-level cursor)
    if (primaryService.model && primaryService.model.collection && typeof primaryService.model.collection.aggregate === "function") {
      // Node driver: collection.aggregate(pipeline, { cursor: { batchSize } })
      // This returns a Cursor which in modern drivers is async-iterable.
      const nativeCursor = primaryService.model.collection.aggregate(pipeline, { cursor: { batchSize } } as any);

      if (nativeCursor && typeof (nativeCursor as any)[Symbol.asyncIterator] === "function") {
        return nativeCursor as AsyncIterableIterator<any>;
      }

      // If nativeCursor exposes stream() which is async iterable
      if (nativeCursor && typeof (nativeCursor as any).stream === "function") {
        const stream = (nativeCursor as any).stream();
        if (stream && typeof (stream as any)[Symbol.asyncIterator] === "function") {
          return (stream as any)[Symbol.asyncIterator]() as AsyncIterableIterator<any>;
        }
      }
    }

    throw new Error("Unable to create an async iterable cursor from aggregate()");
  } catch (err) {
  console.error("buildSearchCursor error creating cursor:", (err as any)?.stack ?? (err as any)?.message ?? err);
  throw err;
}

}


