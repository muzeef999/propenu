import mongoose from "mongoose";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Residential from "../models/residentialModel";
import { connectDB } from "../config/db";

type Suggestion = {
  label: string;
  value: string;
  type: "residential" | "land" | "commercial" | "locality";
};

const activeQuery = {
  status: "active",
  isPublished: true,
};

async function ensureDB() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

async function topLocalities(model: any, extraMatch: Record<string, any> = {}, limit = 4) {
  return model.aggregate([
    {
      $match: {
        ...activeQuery,
        ...extraMatch,
        locality: { $exists: true, $nin: ["", null] },
      },
    },
    {
      $group: {
        _id: {
          locality: "$locality",
          city: "$city",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
}

export async function getStarterSuggestions(city?: string): Promise<Suggestion[]> {
  await ensureDB();

  const cityMatch = city ? { city: new RegExp(city, "i") } : {};

  const [bhkLocalities, landLocalities, commercialLocalities] = await Promise.all([
    topLocalities(Residential, { ...cityMatch, bhk: { $exists: true, $ne: null } }, 5),
    topLocalities(LandPlot, cityMatch, 4),
    topLocalities(Commercial, cityMatch, 4),
  ]);

  const suggestions: Suggestion[] = [];

  if (city) {
    suggestions.push({
      label: `${city} market insights`,
      value: `Show analytics for ${city}`,
      type: "locality",
    });
  }

  for (const item of bhkLocalities) {
    const locality = cleanText(item._id?.locality);
    if (!locality) continue;

    const topBhk = await Residential.aggregate([
      {
        $match: {
          ...activeQuery,
          ...cityMatch,
          locality,
          bhk: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$bhk", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const bhk = topBhk[0]?._id;
    suggestions.push({
      label: bhk ? `${bhk} BHK in ${locality}` : `Homes in ${locality}`,
      value: bhk ? `${bhk} BHK in ${locality}` : `Homes in ${locality}`,
      type: "residential",
    });
  }

  for (const item of landLocalities) {
    const locality = cleanText(item._id?.locality);
    if (!locality) continue;
    suggestions.push({
      label: `Plots in ${locality}`,
      value: `Plots in ${locality}`,
      type: "land",
    });
  }

  for (const item of commercialLocalities) {
    const locality = cleanText(item._id?.locality);
    if (!locality) continue;
    suggestions.push({
      label: `Commercial in ${locality}`,
      value: `Commercial in ${locality}`,
      type: "commercial",
    });
  }

  const seen = new Set<string>();
  return suggestions
    .filter((suggestion) => {
      const key = suggestion.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export async function getLocalityOptions(memory: any): Promise<string[]> {
  await ensureDB();

  const cityMatch = memory.city ? { city: new RegExp(memory.city, "i") } : {};
  const category = memory.propertyCategory;

  const model =
    category === "land"
      ? LandPlot
      : category === "commercial"
        ? Commercial
        : Residential;

  const localities = await topLocalities(model, cityMatch, 6);

  return localities
    .map((item: any) => cleanText(item._id?.locality))
    .filter(Boolean)
    .map((locality: string) => `Search in ${locality}`);
}
