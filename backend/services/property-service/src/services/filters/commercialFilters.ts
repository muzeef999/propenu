import { BaseFilters, CommercialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendCommercialFilters(
    query: CommercialQuery = {},  
    baseFilter: Partial<BaseFilters> = {}
  ): Partial<BaseFilters> {
    const f: any = { ...baseFilter };

 
  const q = query ?? {};         

   if(q.search){
    f.title = { $regex: query.search, $options: "i" }
   }


   if(q.city) {
    f.city = q.city;
   }

   if(q.listingSource) {
    f.listingSource = q.listingSource;
   }

    const minPrice = parseNumber(q.minPrice);
  const maxPrice = parseNumber(q.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    f.price = {};
    if (minPrice !== undefined) f.price.$gte = minPrice;
    if (maxPrice !== undefined) f.price.$lte = maxPrice;
  }

   const minArea = parseNumber(q.minCarpetArea);
  const maxArea = parseNumber(q.maxCarpetArea);

  if (minArea !== undefined || maxArea !== undefined) {
    f.carpetArea = {};
    if (minArea !== undefined) f.carpetArea.$gte = minArea;
    if (maxArea !== undefined) f.carpetArea.$lte = maxArea;
  }


    const floorNumber = parseNumber(q.floorNumber);
  const totalFloors = parseNumber(q.totalFloors);

   if (floorNumber !== undefined) f.floorNumber = floorNumber;
  if (totalFloors !== undefined) f.totalFloors = totalFloors;


   if (q.furnishedStatus) {
    f.furnishedStatus  = q.furnishedStatus;
  }

   if (q.powerBackup) {
    f.powerBackup = q.powerBackup;
  }

  const minPower = parseNumber(q.minPowerCapacityKw);
  const maxPower = parseNumber(q.maxPowerCapacityKw);

  if (minPower !== undefined || maxPower !== undefined) {
    f.powerCapacityKw = {};
    if (minPower !== undefined) f.powerCapacityKw.$gte = minPower;
    if (maxPower !== undefined) f.powerCapacityKw.$lte = maxPower;
  }

  if (q.constructionStatus) {
    f.constructionStatus = q.constructionStatus;
  }


   if (q.propertyType) {
    f.propertyType = q.propertyType;
  }

    if (q.propertySubType) {
    f.propertySubType = q.propertySubType;
  }

  if(typeof q.amenities === "string"){
    const amenityTitle = q.amenities.split(",").map((a) => a.trim()).filter((Boolean));

    if(amenityTitle.length > 0){
     f["amenities.title"] = { $all: amenityTitle };
    }
}
  return f;
}
