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

  
  if (q.city) {
    f.city = q.city;
  }



  if (q.listingSource) {
    f.listingSource = q.listingSource;
  }

  const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

    if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};
    if (minPrice !== undefined) f.price.$gte = minPrice;
    if (maxPrice !== undefined) f.price.$lte = maxPrice;
  }

  
  const bhk = parseNumber(q.bhk);

  if(bhk !== undefined){
    f.bhk = bhk;
  }


   if(q.listingSource) {
    f.listingSource = q.listingSource;
   }
   
  if(q.furnishing){
    f.furnishing = q.furnishing;
  }

  if(q.propertyType){
    f.propertyType = q.propertyType;
  }

  if(q.facing){
    f.facing = q.facing;
  }

  if(q.constructionStatus){
        f.constructionStatus = q.constructionStatus;

  }

  if (q.transactionType) {
    f.transactionType = q.transactionType;
  }


  if (q.propertyType) {
    f.propertyType = q.propertyType;
  }

  if(typeof q.amenities === "string"){
    const amenityTitle = q.amenities.split(",").map((a) => a.trim()).filter((Boolean));

    if(amenityTitle.length > 0){
     f["amenities.title"] = { $all: amenityTitle };
    }
}
  
console.log("🏠 FINAL RESIDENTIAL MATCH:", f);

  return f;
}
