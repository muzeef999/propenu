import Residential from "../models/residentialModel";

export async function getRecommendations(
  property: { city?: string; price?: number }
) {
  const query: any = {
    city: property.city,
  };

  if (typeof property.price === "number") {
    query.price = {
      $gte: property.price * 0.8,

      $lte: property.price * 1.2
    };
  }

  return await Residential.find(query).limit(5);
}
