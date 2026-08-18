import { Response } from "express";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import FeaturedProject from "../models/featurePropertiesModel";
import { AuthRequest } from "../middlewares/authMiddleware";

type CountBucket = { projects: number; properties: number; total: number };

const emptyBucket = (): CountBucket => ({
  projects: 0,
  properties: 0,
  total: 0,
});

/** Lowercase + trim string — used only for exact key equality, not fuzzy match */
const normExpr = (field: string) => ({
  $toLower: {
    $trim: {
      input: {
        $convert: {
          input: { $ifNull: [`$${field}`, ""] },
          to: "string",
          onError: "",
          onNull: "",
        },
      },
    },
  },
});

function bump(
  map: Record<string, CountBucket>,
  key: string,
  kind: "projects" | "properties",
  amount = 1,
) {
  const n = Number(amount) || 0;
  if (!key || n <= 0) return;
  const row = map[key] || emptyBucket();
  row[kind] += n;
  row.total = row.projects + row.properties;
  map[key] = row;
}

async function loadPlaceDocs(model: {
  aggregate: (pipeline: any[]) => Promise<any[]>;
  modelName?: string;
}) {
  try {
    return await model.aggregate([
      {
        $project: {
          state: normExpr("state"),
          city: normExpr("city"),
          locality: normExpr("locality"),
        },
      },
      { $match: { state: { $nin: [null, ""] } } },
    ]);
  } catch (err) {
    console.error(
      `locationListingCounts load failed (${model?.modelName || "model"}):`,
      err,
    );
    return [];
  }
}

/**
 * Exact hierarchy only:
 * - state
 * - state|city
 * - state|city|locality
 * Never mixes aliases, address text, or name-only keys across places.
 */
function absorbDocs(
  docs: Array<{ state?: string; city?: string; locality?: string }>,
  byState: Record<string, CountBucket>,
  byCity: Record<string, CountBucket>,
  byLocality: Record<string, CountBucket>,
  kind: "projects" | "properties",
) {
  for (const doc of docs) {
    const state = String(doc.state || "").trim().toLowerCase();
    if (!state) continue;

    const city = String(doc.city || "").trim().toLowerCase();
    const locality = String(doc.locality || "").trim().toLowerCase();

    bump(byState, state, kind, 1);

    if (city) {
      bump(byCity, `${state}|${city}`, kind, 1);
    }

    if (city && locality) {
      bump(byLocality, `${state}|${city}|${locality}`, kind, 1);
    }
  }
}

/**
 * GET /analytics/location-counts
 * Unique project + property counts per exact state / city / locality.
 */
export const locationListingCounts = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const propertyModels = [Residential, Commercial, LandPlot, Agricultural];

    const [projectDocs, ...propertyDocSets] = await Promise.all([
      loadPlaceDocs(FeaturedProject),
      ...propertyModels.map((model) => loadPlaceDocs(model)),
    ]);

    const byState: Record<string, CountBucket> = {};
    const byCity: Record<string, CountBucket> = {};
    const byLocality: Record<string, CountBucket> = {};

    absorbDocs(projectDocs, byState, byCity, byLocality, "projects");
    for (const docs of propertyDocSets) {
      absorbDocs(docs, byState, byCity, byLocality, "properties");
    }

    res.status(200).json({
      success: true,
      data: { byState, byCity, byLocality },
      meta: {
        states: Object.keys(byState).length,
        cities: Object.keys(byCity).length,
        localities: Object.keys(byLocality).length,
        projectDocs: projectDocs.length,
        propertyDocs: propertyDocSets.reduce((n, d) => n + d.length, 0),
      },
    });
  } catch (error) {
    console.error("Location listing counts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location listing counts",
    });
  }
};
