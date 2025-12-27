import AgriculturalService from "../agriculturalServices";
import CommercialService from "../commercialService";
import LandService from "../landService";
import ResidentialPropertyService from "../residentialServices";

export const CATEGORY_SERVICE_MAP: Record<string, any> = {
  Residential: ResidentialPropertyService,
  Commercial: CommercialService,
  Land: LandService,
  Agricultural: AgriculturalService,
};


export default async function buildSearchCursor(payload: any) {
  const { filter, batchSize = 50 } = payload;

  if (!filter?.category) {
    throw new Error("category is required");
  }

  const service = CATEGORY_SERVICE_MAP[filter.category];

  if (!service) {
    throw new Error(`Invalid category: ${filter.category}`);
  }

  const pipeline = service.getPipeline(filter);

  pipeline.push({ $sort: { createdAt: -1 } });

  return service.model.aggregate(pipeline).cursor({ batchSize });
}
