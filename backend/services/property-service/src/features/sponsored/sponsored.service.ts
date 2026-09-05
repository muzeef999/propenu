import Agricultural from "../../models/agriculturalModel";
import Commercial from "../../models/commercialModel";
import FeaturedProject from "../../models/featurePropertiesModel";
import LandPlot from "../../models/landModel";
import Residential from "../../models/residentialModel";

function attachType(data: any[], type: string) {
  return data.map((item) => ({
    ...item.toObject?.() || item,
    type
  }));
}

function findSponsored(model: any, filter: any, limit = 10) {
  return model
    .find(filter)
    .populate("createdBy", "name fullName companyName email phone role roleName roleId")
    .populate("createdBy.roleId", "name label")
    .limit(limit);
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
      data = attachType(await findSponsored(Residential, baseFilter), "residential");
      break;
    case "commercial":
      data = attachType(await findSponsored(Commercial, baseFilter), "commercial");
      break;
    case "land":
      data = attachType(await findSponsored(LandPlot, baseFilter), "land");
      break;
    case "agricultural":
      data = attachType(await findSponsored(Agricultural, baseFilter), "agricultural");
      break;
    case "featuredproject":
    case "featured-project":
    case "project":
      data = attachType(await findSponsored(FeaturedProject, baseFilter), "featuredproject");
      break;
    default:
      const [res, com, land, agri, projects] = await Promise.all([
        findSponsored(Residential, baseFilter),
        findSponsored(Commercial, baseFilter),
        findSponsored(LandPlot, baseFilter),
        findSponsored(Agricultural, baseFilter),
        findSponsored(FeaturedProject, baseFilter)
      ]);
      data = [
        ...attachType(res, "residential"),
        ...attachType(com, "commercial"),
        ...attachType(land, "land"),
        ...attachType(agri, "agricultural"),
        ...attachType(projects, "featuredproject")
      ];
  }

  return data;
};
