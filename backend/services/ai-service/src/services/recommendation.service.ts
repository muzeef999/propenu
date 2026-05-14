export async function getRecommendations(
  property
) {

  return await Residential.find({
    city: property.city,

    price: {
      $gte: property.price * 0.8,

      $lte: property.price * 1.2
    }
  }).limit(5);
}