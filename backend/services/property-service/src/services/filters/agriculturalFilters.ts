import type { Request } from "express";
import { AgriculturalQuery, BaseFilters } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendAgriculturalFilters(
  query: AgriculturalQuery = {},
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  f.status = "active";
  const q = query ?? {};

  const and: any[] = [];

  /* ---------------- SEARCH (title) ---------------- */
  if (typeof q.search === "string" && q.search.trim()) {
    const words = q.search.trim().split(/\s+/);
    for (const word of words) {
      and.push({
        title: { $regex: word, $options: "i" },
      });
    }
  }
  if (typeof q.listingType === "string") {
    f.listingType = q.listingType.toLowerCase();
  }

  /* ---------------- CITY (SAFE) ---------------- */
  if (q.city) {
    and.push({
      $or: [
        { city: q.city },
        { title: { $regex: q.city, $options: "i" } },
      ],
    });
  }

  /* ---------------- LOCALITY (SAFE) ---------------- */
  if (typeof q.locality === "string" && q.locality.trim()) {
    const localities = q.locality.split(",").map(l => l.trim());

    and.push({
      $or: [
        { locality: { $in: localities } },
        { title: { $regex: localities.join("|"), $options: "i" } },
      ],
    });
  }

  /* ---------------- PRICE ---------------- */
  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price: any = {};
    if (minPrice !== undefined) price.$gte = minPrice;
    if (maxPrice !== undefined) price.$lte = maxPrice;
    and.push({ price });
  }

  /* ---------------- AREA ---------------- */
  const minArea = parseNumber(q.minArea);
  const maxArea = parseNumber(q.maxArea);

  if (minArea !== undefined || maxArea !== undefined) {
    const area: any = {};
    if (minArea !== undefined) area.$gte = minArea;
    if (maxArea !== undefined) area.$lte = maxArea;
    and.push({ "totalArea.value": area });
  }

  /* ---------------- SOIL / IRRIGATION ---------------- */
  if (q.soilType) and.push({ soilType: q.soilType });
  if (q.irrigationType) and.push({ irrigationType: q.irrigationType });

  /* ---------------- BOREWELLS ---------------- */
  const minBore = parseNumber(q.minBorewells);
  const maxBore = parseNumber(q.maxBorewells);

  if (minBore !== undefined || maxBore !== undefined) {
    const bw: any = {};
    if (minBore !== undefined) bw.$gte = minBore;
    if (maxBore !== undefined) bw.$lte = maxBore;
    and.push({ numberOfBorewells: bw });
  }

  if (and.length) f.$and = and;

  return f;
}
