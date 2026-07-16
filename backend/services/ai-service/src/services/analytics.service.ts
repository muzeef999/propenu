import mongoose from "mongoose";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";
import Residential from "../models/residentialModel";
import { connectDB } from "../config/db";

const activeQuery = {
  status: "active",
  isPublished: true,
};

async function ensureDB() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
}

function cityQuery(city?: string) {
  return city ? { city: new RegExp(city, "i") } : {};
}

function validPriceMatch() {
  return {
    price: {
      $gte: 100000,
      $lte: 1000000000,
    },
  };
}

async function count(model: any, city?: string) {
  return model.countDocuments({
    ...activeQuery,
    ...cityQuery(city),
  });
}

async function topLocalities(model: any, city?: string, limit = 5) {
  return model.aggregate([
    {
      $match: {
        ...activeQuery,
        ...cityQuery(city),
        locality: { $exists: true, $nin: ["", null] },
      },
    },
    {
      $group: {
        _id: "$locality",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
}

async function bhkMix(city?: string) {
  return Residential.aggregate([
    {
      $match: {
        ...activeQuery,
        ...cityQuery(city),
        ...validPriceMatch(),
        bhk: { $gte: 1, $lte: 10 },
      },
    },
    {
      $group: {
        _id: "$bhk",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
}

function formatMoney(value?: number) {
  if (!value || Number.isNaN(value)) return null;
  if (value > 1000000000) return null;
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(0)} L`;
  return String(Math.round(value));
}

export async function getCityAnalytics(city?: string) {
  await ensureDB();

  const [
    residentialCount,
    landCount,
    commercialCount,
    agriculturalCount,
    residentialLocalities,
    landLocalities,
    commercialLocalities,
    agriculturalLocalities,
    bhks,
  ] = await Promise.all([
    count(Residential, city),
    count(LandPlot, city),
    count(Commercial, city),
    count(Agricultural, city),
    topLocalities(Residential, city),
    topLocalities(LandPlot, city),
    topLocalities(Commercial, city),
    topLocalities(Agricultural, city),
    bhkMix(city),
  ]);

  const total = residentialCount + landCount + commercialCount + agriculturalCount;
  const topResidential = residentialLocalities[0];
  const topLand = landLocalities[0];
  const topCommercial = commercialLocalities[0];
  const topAgricultural = agriculturalLocalities[0];
  const topBhk = bhks[0];

  const lines = [
    `${city || "This city"} has ${total} active verified listings in our current inventory.`,
    residentialCount
      ? `Residential leads with ${residentialCount} listings${topResidential?._id ? `, especially around ${topResidential._id}` : ""}.`
      : "",
    landCount
      ? `Plots/land has ${landCount} listings${topLand?._id ? `, with activity around ${topLand._id}` : ""}.`
      : "",
    commercialCount
      ? `Commercial has ${commercialCount} listings${topCommercial?._id ? `, led by ${topCommercial._id}` : ""}.`
      : "",
    agriculturalCount
      ? `Agricultural land has ${agriculturalCount} listings${topAgricultural?._id ? `, active around ${topAgricultural._id}` : ""}.`
      : "",
    topBhk
      ? `${topBhk._id} BHK is the most visible home format${formatMoney(topBhk.avgPrice) ? ` with average ask around ${formatMoney(topBhk.avgPrice)}` : ""}.`
      : "",
  ].filter(Boolean);

  const options = [
    topResidential?._id ? `Homes in ${topResidential._id}` : "",
    topBhk?._id ? `${topBhk._id} BHK in ${city || "this city"}` : "",
    topLand?._id ? `Plots in ${topLand._id}` : "",
    topCommercial?._id ? `Commercial in ${topCommercial._id}` : "",
  ].filter(Boolean);

  return {
    total,
    counts: {
      residential: residentialCount,
      land: landCount,
      commercial: commercialCount,
      agricultural: agriculturalCount,
    },
    topLocalities: {
      residential: residentialLocalities,
      land: landLocalities,
      commercial: commercialLocalities,
      agricultural: agriculturalLocalities,
    },
    bhkMix: bhks,
    summary: lines.join(" "),
    metrics: [
      { label: "Verified listings", value: total, tone: "emerald" },
      { label: "Homes", value: residentialCount, tone: "blue" },
      { label: "Plots", value: landCount, tone: "amber" },
      { label: "Commercial", value: commercialCount, tone: "violet" },
      { label: "Agricultural", value: agriculturalCount, tone: "lime" },
    ],
    highlights: lines,
    options,
  };
}
