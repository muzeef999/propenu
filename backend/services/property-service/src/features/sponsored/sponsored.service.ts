import Agricultural from "../../models/agriculturalModel";
import Commercial from "../../models/commercialModel";
import LandPlot from "../../models/landModel";
import Residential from "../../models/residentialModel";

function attachType(data: any[], type: string) {
  return data.map((item) => ({
    ...item.toObject?.() || item,
    type
  }));
}

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
      data = attachType(await Residential.find(baseFilter).limit(10), "residential");
      break;
    case "commercial":
      data = attachType(await Commercial.find(baseFilter).limit(10), "commercial");
      break;
    case "land":
      data = attachType(await LandPlot.find(baseFilter).limit(10), "land");
      break;
    case "agricultural":
      data = attachType(await Agricultural.find(baseFilter).limit(10), "agricultural");
      break;
    default:
      const [res, com, land, agri] = await Promise.all([
        Residential.find(baseFilter),
        Commercial.find(baseFilter),
        LandPlot.find(baseFilter),
        Agricultural.find(baseFilter)
      ]);
      data = [
        ...attachType(res, "residential"),
        ...attachType(com, "commercial"),
        ...attachType(land, "land"),
        ...attachType(agri, "agricultural")
      ];
  }

  return data;
};