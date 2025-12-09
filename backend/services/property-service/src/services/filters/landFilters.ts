import type { Request } from "express";
import { BaseFilters, LandQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

type TypedRequestQuery<Q> = Request & { query: Q };

export function extendLandFilters(
  req: TypedRequestQuery<LandQuery>,
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };
  const q = req.query;
  const minPlot = parseNumber(req.query.minPlotArea);
  const maxPlot = parseNumber(req.query.maxPlotArea);
  const plotUnit = (req.query.plotAreaUnit as string | undefined)?.trim();

  if (minPlot !== undefined || maxPlot !== undefined) {
    f.plotArea = {};
    if (minPlot !== undefined) f.plotArea.$gte = minPlot;
    if (maxPlot !== undefined) f.plotArea.$lte = maxPlot;
  }
  if (plotUnit) f.plotAreaUnit = plotUnit;
  if (req.query.negotiable === "true") f.negotiable = true;
  if (req.query.cornerPlot === "true") f.cornerPlot = true;
  return f;
}