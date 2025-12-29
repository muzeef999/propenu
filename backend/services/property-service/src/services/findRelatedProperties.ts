import mongoose from "mongoose";

type RelatedConfig = {
  modelName: string;
  extraFilters?: (property: any) => Record<string, any>;
};

export async function findRelatedProperties(
  property: any,
  config: RelatedConfig
) {
  const Model = mongoose.model(config.modelName);

  const query: any = {
    _id: { $ne: property._id },
    status: "active",
    listingType: property.listingType,
    city: property.city,
  };

  // Locality is strong signal
  if (property.locality) {
    query.locality = property.locality;
  }

  // Price similarity (±20%)
  if (property.price) {
    query.price = {
      $gte: property.price * 0.8,
      $lte: property.price * 1.2,
    };
  }

  // Category-specific filters
  if (config.extraFilters) {
    Object.assign(query, config.extraFilters(property));
  }

  return Model.find(query)
    .limit(6)
    .select("title slug price gallery locality city")
    .lean();
}
