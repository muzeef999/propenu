import type { Request } from "express";
import { BaseFilters, CommercialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";


type TypedRequestQuery<Q> = Request & { query: Q };

export function extendCommercialFilters(
    req: TypedRequestQuery<CommercialQuery>,
    baseFilter: Partial<BaseFilters> = {}
  ): Partial<BaseFilters> {
    const f: any = { ...baseFilter };

    const q = req.query;

  const minArea = parseNumber(q.minCarpetArea);
  const maxArea = parseNumber(q.maxCarpetArea);
  const minPower = parseNumber(q.minPowerCapacityKw);
  const maxPower = parseNumber(q.maxPowerCapacityKw);
  const loadingDock = q.loadingDock === "true" ? true : (q.loadingDock === "false" ? false : undefined);

  if (minArea !== undefined || maxArea !== undefined) {
    f.carpetArea = {};
    if (minArea !== undefined) f.carpetArea.$gte = minArea;
    if (maxArea !== undefined) f.carpetArea.$lte = maxArea;
  }
  if (minPower !== undefined || maxPower !== undefined) {
    f.powerCapacityKw = {};
    if (minPower !== undefined) f.powerCapacityKw.$gte = minPower;
    if (maxPower !== undefined) f.powerCapacityKw.$lte = maxPower;
  }
  if (loadingDock !== undefined) f.loadingDock = loadingDock;

  return f;
}
