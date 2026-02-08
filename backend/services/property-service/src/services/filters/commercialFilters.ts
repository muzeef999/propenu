import { BaseFilters, CommercialQuery } from "../../types/filterTypes";
import parseNumber from "../../utils/parseNumber";

export function extendCommercialFilters(
  query: CommercialQuery = {},
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

    f.$and = words.map((word: string) => ({
      title: { $regex: word, $options: "i" },
    }));
  }

  if (q.city) {
    f.city = q.city;
  }

if (typeof q.locality === "string" && q.locality.trim().length > 0) {
    const localities = q.locality
      .split(",")
      .map((loc) => loc.trim())
      .filter(Boolean);

    if (localities.length === 1) f.locality = localities[0];
    else if (localities.length > 1) f.locality = { $in: localities };
  }

  if (q.listingType) {
    f.listingType = q.listingType;
  }

  if (
    typeof q.listingSource === "string" &&
    q.listingSource.trim().length > 0
  ) {
    const sources = q.listingSource
      .split(",")
      .map((src) => src.trim())
      .filter(Boolean);

    if (sources.length === 1) f.listingSource = sources[0];
    else if (sources.length > 1) f.listingSource = { $in: sources };
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

  const minArea = parseNumber(q.minCarpetArea);
  const maxArea = parseNumber(q.maxCarpetArea);

  if (minArea !== undefined || maxArea !== undefined) {
  const areaFilter: any = {};
  if (minArea !== undefined) areaFilter.$gte = minArea;
  if (maxArea !== undefined) areaFilter.$lte = maxArea;

  f.$or = [
    { carpetArea: areaFilter },
    { builtUpArea: areaFilter },
  ];
}


  const floorNumber = parseNumber(q.floorNumber);
  const totalFloors = parseNumber(q.totalFloors);

  if (floorNumber !== undefined) f.floorNumber = floorNumber;
  if (totalFloors !== undefined) f.totalFloors = totalFloors;

  if (q.furnishedStatus) {
    f.furnishedStatus = q.furnishedStatus;
  }

  if (q.powerBackup) {
    f.powerBackup = q.powerBackup;
  }

  const minPower = parseNumber(q.minPowerCapacityKw);
  const maxPower = parseNumber(q.maxPowerCapacityKw);

 if (minPower !== undefined || maxPower !== undefined) {
  f.powerCapacityKw = {};

  if (minPower !== undefined && maxPower !== undefined) {
    f.powerCapacityKw.$gte = Math.min(minPower, maxPower);
    f.powerCapacityKw.$lte = Math.max(minPower, maxPower);
  } else if (minPower !== undefined) {
    f.powerCapacityKw.$gte = minPower;
  } else {
    f.powerCapacityKw.$lte = maxPower;
  }
}


  if (q.constructionStatus) {
    f.constructionStatus = q.constructionStatus;
  }

  if (typeof q.propertyType === "string" && q.propertyType.trim().length > 0) {
    const types = q.propertyType
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (types.length === 1) f.propertyType = types[0];
    else if (types.length > 1) f.propertyType = { $in: types };
  }


  if (
    typeof q.propertySubType === "string" &&
    q.propertySubType.trim().length > 0
  ) {
    const subTypes = q.propertySubType
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (subTypes.length === 1) f.propertySubType = subTypes[0];
    else if (subTypes.length > 1) f.propertySubType = { $in: subTypes };
  }

  return f;
}
