import Agricultural from "../../models/agriculturalModel";
import Commercial from "../../models/commercialModel";
import LandPlot from "../../models/landModel";
import Residential from "../../models/residentialModel";

export const getSponsoredProperties = async (filters: any) => {
  const baseFilter: any = {
    status: "active",
    "promotion.type": "sponsored",
    $or: [
      { "promotion.boostExpiry": { $gt: new Date() } },
      { "promotion.boostExpiry": { $exists: false } }
    ]
  };

  if (filters.city) baseFilter.city = filters.city;
  if (filters.listingType) baseFilter.listingType = filters.listingType;

  let data: any[] = [];

  switch (filters.category?.toLowerCase()) {
    case "residential":
      data = await Residential.find(baseFilter).limit(10);
      break;
    case "commercial":
      data = await Commercial.find(baseFilter).limit(10);
      break;
    case "land":
      data = await LandPlot.find(baseFilter).limit(10);
      break;
    case "agricultural":
      data = await Agricultural.find(baseFilter).limit(10);
      break;
    default:
      const [res, com, land, agri] = await Promise.all([
        Residential.find(baseFilter),
        Commercial.find(baseFilter),
        LandPlot.find(baseFilter),
        Agricultural.find(baseFilter)
      ]);
      data = [...res, ...com, ...land, ...agri];
  }

  return data;
};