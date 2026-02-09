import { BaseFilters, LandQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendLandFilters(
  query: LandQuery = {},
  baseFilter: Partial<BaseFilters> = {},
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

  f.status = "active";

  const q = query ?? {};

  if (typeof q.search === "string" && q.search.trim().length > 0) {
    const words = q.search
      .split(/\s+/) // handles multiple spaces safely
      .map((word: string) => word.trim())
      .filter(Boolean);

    f.$and = words.map((word) => ({
      title: { $regex: word, $options: "i" },
    }));
  }

  if (q.city) {
    f.city = q.city;
  }
  if (q.listingType) {
  f.listingType = q.listingType;
}


  if (typeof q.locality === "string" && q.locality.trim().length > 0) {
    const localities = q.locality.split(",");
    if (localities.length === 1) f.locality = localities[0];
    else if (localities.length > 1) f.locality = { $in: localities };
  }

  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};

    if (minPrice !== undefined && maxPrice !== undefined) {
      f.price.$gte = Math.min(minPrice, maxPrice);
      f.price.$lte = Math.max(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      f.price.$gte = minPrice;
    } else {
      f.price.$lte = maxPrice;
    }
  }

  const minPlot = parseNumber(q.minPlotArea);
  const maxPlot = parseNumber(q.maxPlotArea);
  const plotUnit = (q.plotAreaUnit as string | undefined)?.trim();

  if (minPlot !== undefined || maxPlot !== undefined) {
    f.plotArea = {};
    if (minPlot !== undefined) f.plotArea.$gte = minPlot;
    if (maxPlot !== undefined) f.plotArea.$lte = maxPlot;
  }
  if (plotUnit) f.plotAreaUnit = plotUnit;
  if (q.negotiable === "true") f.negotiable = true;
  if (q.cornerPlot === "true") f.cornerPlot = true;
  return f;
}
