// services/ownerProperties.ts
import mongoose from "mongoose";
import Residential from "../models/residentialModel";
import LandPlot from "../models/landModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";

const W = { views: 0.1, inquiries: 5, clicks: 0.5 };

function computeScore(meta: any) {
  const views = Number(meta?.views || 0);
  const inquiries = Number(meta?.inquiries || 0);
  const clicks = Number(meta?.clicks || 0);
  return W.views * Math.log(1 + views) + W.inquiries * inquiries + W.clicks * clicks;
}

export async function getPopularOwnerPropertiesByCity(city: string, page = 1, limit = 20) {
  const cityFilter = city && typeof city === "string" ? { city } : {};

  const baseFilter = {
    ...cityFilter,
      listingSource: { $regex: /^user$/i }, 
    status: "active"
  };

  const resprojection = {
    title: 1, slug: 1, gallery: 1, price: 1, currency: 1, builtUpArea:1, constructionStatus:1, furnishing:1, parkingDetails:1, buildingName:1, pricePerSqft:1,
    "meta.views": 1, "meta.inquiries": 1, "meta.clicks": 1,
    createdAt: 1, updatedAt: 1, status: 1, rank: 1, propertyType: 1, propertySubType: 1, listingSource: 1, city: 1
  };

  
  const comprojection = {
    title: 1, slug: 1, gallery: 1, price: 1, currency: 1, builtUpArea:1, furnishing:1, floorNumber:1, totalFloors:1, parkingDetails:1, buildingName:1, pricePerSqft:1,
    "meta.views": 1, "meta.inquiries": 1, "meta.clicks": 1,
    createdAt: 1, updatedAt: 1, status: 1, rank: 1, propertyType: 1, propertySubType: 1, listingSource: 1, city: 1
  };

  const landprojection = {
    title: 1, slug: 1, gallery: 1, price: 1, currency: 1, dimensions:1, furnishing:1, roadWidthFt:1, plotArea:1, pricePerSqft:1, facing:1,  landName:1,
    "meta.views": 1, "meta.inquiries": 1, "meta.clicks": 1,
    createdAt: 1, updatedAt: 1, status: 1, rank: 1, propertyType: 1, propertySubType: 1, listingSource: 1, city: 1
  };

  const agrprojection = {
    title: 1, slug: 1, gallery: 1, price: 1, currency: 1, superBuiltUpArea:1, soilType:1,accessRoadType:1,waterSource:1, landName:1, totalArea:1,
    "meta.views": 1, "meta.inquiries": 1, "meta.clicks": 1,
    createdAt: 1, updatedAt: 1, status: 1, rank: 1, propertyType: 1, propertySubType: 1, listingSource: 1, city: 1
  };
  const perCollectionLimit = 2000; // safety ceiling — tune for your app

  const [resList, landList, comList, agrList] = await Promise.all([
    Residential.find(baseFilter).select(resprojection).limit(perCollectionLimit).lean().exec(),
    LandPlot.find(baseFilter).select(landprojection).limit(perCollectionLimit).lean().exec(),
    Commercial.find(baseFilter).select(comprojection).limit(perCollectionLimit).lean().exec(),
    Agricultural.find(baseFilter).select(agrprojection).limit(perCollectionLimit).lean().exec()
  ]);

  const normalized: any[] = [];

for (const doc of resList) normalized.push({ ...doc, type: "residential", popularityScore: computeScore((doc as any).meta) });
for (const doc of landList) normalized.push({ ...doc, type: "land", popularityScore: computeScore((doc as any).meta) });
for (const doc of comList) normalized.push({ ...doc, type: "commercial", popularityScore: computeScore((doc as any).meta) });
for (const doc of agrList) normalized.push({ ...doc, type: "agricultural", popularityScore: computeScore((doc as any).meta) });

  // sort by popularityScore desc, tie-breaker createdAt desc
  normalized.sort((a, b) => {
    if (b.popularityScore !== a.popularityScore) return b.popularityScore - a.popularityScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // paginate
  const total = normalized.length;
  const start = Math.max(0, (page - 1)) * limit;
  const items = normalized.slice(start, start + limit);

  return { total, page, limit, items };
}
