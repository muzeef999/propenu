import { BaseFilters, LandQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";



export function extendLandFilters(
  query: LandQuery = {},
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };

    const q = query ?? {};         

   if(query.search){
    f.title = { $regex: query.search, $options: "i" }
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