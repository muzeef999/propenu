import type { Request } from "express";
import { AgriculturalQuery, BaseFilters } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";


type TypedRequestQuery<Q> = Request & { query: Q };


export function extendAgriculturalFilters(req: TypedRequestQuery<AgriculturalQuery>,
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> {
  const f: any = { ...baseFilter };
  const q = req.query; 

  const minArea = parseNumber(q.minArea);
  const maxArea = parseNumber(q.maxArea);
  const soilType = (q.soilType as string | undefined)?.trim();
  const irrigationType = (q.irrigationType as string | undefined)?.trim();
  const minBorewells = parseNumber(q.minBorewells);
  const maxBorewells = parseNumber(q.maxBorewells);

  if (minArea !== undefined || maxArea !== undefined) {
    f.area = {};
    if (minArea !== undefined) f.area.$gte = minArea;
    if (maxArea !== undefined) f.area.$lte = maxArea;
  }
  if (soilType) f.soilType = soilType;
  if (irrigationType) f.irrigationType = irrigationType;
  if (minBorewells !== undefined || maxBorewells !== undefined) {
    f.numberOfBorewells = {};
    if (minBorewells !== undefined) f.numberOfBorewells.$gte = minBorewells;
    if (maxBorewells !== undefined) f.numberOfBorewells.$lte = maxBorewells;
  }

  return f;
}
