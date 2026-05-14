import Agricultural from "../models/agriculturalModel";
import Commercial from "../models/commercialModel";
import FeaturedProject from "../models/featurePropertiesModel";
import LandPlot from "../models/landModel";
import Residential from "../models/residentialModel";

export async function searchProperties(
  filters: any
) {

  const query: any = {
    status: "active",
    isPublished: true,
  };

  // CITY
  if (filters.city) {
    query.city =
      new RegExp(filters.city, "i");
  }

  // PRICE
  if (filters.maxPrice) {
    query.price = {
      $lte: filters.maxPrice,
    };
  }

  // BHK
  if (filters.bhk) {
    query.bhk = filters.bhk;
  }

  // PROPERTY TYPE
  if (filters.propertyType) {
    query.propertyType =
      new RegExp(
        filters.propertyType,
        "i"
      );
  }

  // RESIDENTIAL
  if (
    filters.propertyType === "villa" ||
    filters.propertyType === "apartment"
  ) {
    return await Residential.find(query)
      .limit(10)
      .lean();
  }

  // LAND
  if (
    filters.propertyCategory ===
    "land"
  ) {
    return await LandPlot.find(query)
      .limit(10)
      .lean();
  }

  // AGRICULTURE
  if (
    filters.propertyCategory ===
    "agricultural"
  ) {
 
    return await Agricultural.find(query)
      .limit(10)
      .lean();
  }

  // MIXED SEARCH
  const [
    residential,
    commercial,
    projects,
  ] = await Promise.all([
    Residential.find(query).limit(5),
    Commercial.find(query).limit(5),
    FeaturedProject.find(query).limit(5),
  ]);

  return [
    ...residential,
    ...commercial,
    ...projects,
  ];
}