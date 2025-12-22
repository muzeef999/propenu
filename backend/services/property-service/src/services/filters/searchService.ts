import AgriculturalService from "../agriculturalServices";
import CommercialService from "../commercialService";
import LandService from "../landService";
import ResidentialPropertyService from "../residentialServices";

const CATEGORY_SERVICE_MAP: Record<string, any> = {
  Residential: ResidentialPropertyService,
  Commercial: CommercialService,
  Land: LandService,
  Agricultural: AgriculturalService,
};

export default async function buildSearchCursor(filters: any) {
    console.log("🔥 STEP 3: buildSearchCursor filters =", filters);

  const { category, batchSize = 50 } = filters;

  if (!category) {
    throw new Error("category is required");
  }

  const service = CATEGORY_SERVICE_MAP[category];


  console.log("🔥 STEP 4: CATEGORY =", category);
console.log("🔥 STEP 4: SERVICE FOUND =", !!service);
  if (!service) {
    throw new Error(`Invalid category: ${category}`);
  }

  // 🔥 THIS IS THE MOST IMPORTANT LINE
  // Only ONE service is called
  const pipeline = service.getPipeline(filters);

  console.log("🔥 STEP 5: PIPELINE =", JSON.stringify(pipeline, null, 2));

  pipeline.push({ $sort: { createdAt: -1 } });


  return service.model.aggregate(pipeline).cursor({ batchSize });
}
