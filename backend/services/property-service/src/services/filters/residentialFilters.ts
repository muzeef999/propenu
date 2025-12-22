import { BaseFilters, ResidentialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendResidentialFilters(
  query: ResidentialQuery = {},  
  baseFilter: Partial<BaseFilters> = {}
): Partial<BaseFilters> { 
  const f: any = { ...baseFilter };


  const q = query ?? {};         

   if(query.search){
    f.title = { $regex: query.search, $options: "i" }
   }

  const bhk = parseNumber(q.bhk);
  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);
  const bedrooms = parseNumber(q.bedrooms);
  const bathrooms = parseNumber(q.bathrooms);

  if (bhk !== undefined) {
  f.bhk = bhk;
}

  if (bedrooms !== undefined) f.bedrooms = bedrooms;
  if (bathrooms !== undefined) f.bathrooms = bathrooms;

  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};
    if (minPrice !== undefined) f.price.$gte = minPrice;
    if (maxPrice !== undefined) f.price.$lte = maxPrice;
  }

  return f;
}
