import mongoose, { Types } from "mongoose";
import Shortlist from "../models/shortlistModel";
import FeaturedProject, { Lead } from "../models/featurePropertiesModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import User from "../models/userModel";

const SHORTLIST_MODEL_MAP: Record<string, any> = {
  Residential,
  Commercial,
  Land: LandPlot,
  Agricultural,
  FeaturedProject,
} as const;

const NOTIFICATION_RETENTION_DAYS = 30;

const getNotificationCutoffDate = () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_RETENTION_DAYS);
  return cutoffDate;
};

const getBuilderFromDate = (range: string) => {
  const now = new Date();

  switch (range) {
    case "1d":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    case "30d":
    default:
      return new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  }
};

export const addToShortlistService = async (
  userId: Types.ObjectId,
  propertyId: string,
  propertyType:
    | "Residential"
    | "Commercial"
    | "Land"
    | "Agricultural"
    | "FeaturedProject",
) => {
  const propertyObjectId = new Types.ObjectId(propertyId);
  const PropertyModel = SHORTLIST_MODEL_MAP[propertyType];

  if (!PropertyModel) {
    throw new Error("Invalid propertyType");
  }

  const property = await PropertyModel.findById(propertyObjectId)
    .select("createdBy")
    .lean();

  if (!property) {
    throw new Error("Property not found");
  }

  if (String((property as any).createdBy) === String(userId)) {
    throw new Error("This is your own property");
  }

  return await (Shortlist.findOneAndUpdate as any)(
    { userId, propertyId: propertyObjectId },
    { $set: { propertyType } },
    { upsert: true, new: true },
  );
};

export const removeFromShortlistService = async (
  userId: string,
  propertyId: string,
) => {
  return await (Shortlist.deleteOne as any)({
    userId: new Types.ObjectId(userId),
    propertyId: new Types.ObjectId(propertyId),
  });
};

export const getUserShortlistService = async (userId: Types.ObjectId) => {
  return Shortlist.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      $facet: {
        residential: [
          { $match: { propertyType: "Residential" } },
          {
            $lookup: {
              from: "residentials",
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },
        ],
        commercial: [
          { $match: { propertyType: "Commercial" } },
          {
            $lookup: {
              from: "commercials",
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },
        ],
        land: [
          { $match: { propertyType: "Land" } },
          {
            $lookup: {
              from: "landplots",
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },
        ],
        agricultural: [
          { $match: { propertyType: "Agricultural" } },
          {
            $lookup: {
              from: "agriculturals",
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },
        ],
        featuredProjects: [
          { $match: { propertyType: "FeaturedProject" } },
          {
            $lookup: {
              from: "featuredprojects",
              localField: "propertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },
        ],
      },
    },
    {
      $project: {
        all: {
          $concatArrays: [
            "$residential",
            "$commercial",
            "$land",
            "$agricultural",
            "$featuredProjects",
          ],
        },
      },
    },
    { $unwind: "$all" },
    { $sort: { "all.createdAt": -1 } },
    {
      $project: {
        _id: "$all._id",
        createdAt: "$all.createdAt",
        propertyType: "$all.propertyType",
        property: {
          _id: "$all.property._id",
          title: "$all.property.title",
          gallery: "$all.property.gallery",
          gallerySummary: "$all.property.gallerySummary",
          heroImage: "$all.property.heroImage",
          address: "$all.property.address",
          locality: "$all.property.locality",
          city: "$all.property.city",
          price: { $ifNull: ["$all.property.price", "$all.property.priceFrom"] },
          priceFrom: "$all.property.priceFrom",
          priceTo: "$all.property.priceTo",
          carpetArea: "$all.property.carpetArea",
          builtUpArea: "$all.property.builtUpArea",
          plotArea: "$all.property.plotArea",
          projectArea: "$all.property.projectArea",
          sqftRange: "$all.property.sqftRange",
          projectSummary: "$all.property.projectSummary",
          bhkSummary: "$all.property.bhkSummary",
          pricePerSqft: "$all.property.pricePerSqft",
          slug: "$all.property.slug",
        },
      },
    },
  ]);
};

export const getShortlistStatusService = async (
  userId: string,
  propertyId: string,
) => {
  const exists = await Shortlist.exists({
    userId: new Types.ObjectId(userId),
    propertyId: new Types.ObjectId(propertyId),
  });
  return Boolean(exists);
};

export const getBuilderAnalytics = async (
  builderId: string,
  range: string = "30d",
  state?: string,
  city?: string,
  fromDateInput?: string,
  toDateInput?: string,
) => {
  const builderObjectId = new mongoose.Types.ObjectId(builderId);
  const isCustomRange =
    range === "custom" && typeof fromDateInput === "string" && typeof toDateInput === "string";
  const fromDate = isCustomRange ? new Date(fromDateInput) : getBuilderFromDate(range);
  const toDate = isCustomRange ? new Date(toDateInput) : null;

  if (isCustomRange && toDate) {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  }

  const match = { createdBy: builderObjectId };
  const normalizedState = state?.trim();
  const normalizedCity = city?.trim();
  const locationMatch = {
    ...(normalizedState ? { state: normalizedState } : {}),
    ...(normalizedCity ? { city: normalizedCity } : {}),
  };
  const createdAtFilter =
    isCustomRange && toDate ? { $gte: fromDate, $lte: toDate } : { $gte: fromDate };
  const rangeMatch = { ...match, ...locationMatch, createdAt: createdAtFilter };
  const portfolioMatch = { ...match, ...locationMatch };
  const featuredPortfolioMatch = { ...portfolioMatch, isFeatured: true };

  const useHourlyTrend = range === "1d" && !isCustomRange;
  const labelLength = isCustomRange && toDate
    ? Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1)
    : range === "1d"
      ? 24
      : range === "7d"
        ? 7
        : 30;

  const labels = Array.from({ length: labelLength }, (_, index) => {
    if (useHourlyTrend) {
      const date = new Date(fromDate.getTime() + index * 60 * 60 * 1000);
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`,
        label: date.toLocaleString("en-US", { hour: "numeric" }),
      };
    }

    const date = new Date(fromDate);
    date.setDate(fromDate.getDate() + index);
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      label:
        range === "7d"
          ? date.toLocaleString("en-US", { weekday: "short" })
          : date.toLocaleString("en-US", { day: "numeric", month: "short" }),
    };
  });

  const formatTrend = (
    rows: Array<{ _id: Record<string, number>; count: number }> = [],
  ) => {
    const countMap = new Map<string, number>(
      rows.map((row) => {
        if (useHourlyTrend) {
          return [
            `${row._id.year}-${row._id.month}-${row._id.day}-${row._id.hour}`,
            row.count,
          ] as const;
        }

        return [
          `${row._id.year}-${row._id.month}-${row._id.day}`,
          row.count,
        ] as const;
      }),
    );

    return labels.map((label) => ({
      label: label.label,
      count: countMap.get(label.key) ?? 0,
    }));
  };

  const getTopBucket = (items: Array<{ _id: string; count: number }> = []) => {
    const top = items[0];
    if (!top) return null;
    return {
      name: top._id || "Unknown",
      count: top.count,
    };
  };

  const publicLeadsCollection = mongoose.connection.collection("publicleads");
  const shortlistProjectMatch = {
    "project.createdBy": builderObjectId,
    ...(normalizedState ? { "project.state": normalizedState } : {}),
    ...(normalizedCity ? { "project.city": normalizedCity } : {}),
  };
  const builderProjects = await FeaturedProject.find(match)
    .select("state city")
    .lean();
  const citiesByState = builderProjects.reduce<Record<string, string[]>>((acc, project) => {
    const projectState = project.state?.trim();
    const projectCity = project.city?.trim();

    if (!projectState || !projectCity) return acc;

    const nextCities = new Set(acc[projectState] ?? []);
    nextCities.add(projectCity);
    acc[projectState] = Array.from(nextCities).sort((left, right) => left.localeCompare(right));
    return acc;
  }, {});
  const availableStates = Object.keys(citiesByState).sort((left, right) => left.localeCompare(right));

  const [
    totalProjects,
    totals,
    featuredProjects,
    cityStats,
    stateStats,
    topViewed,
    statusStats,
    shortlistTotal,
    leadTotal,
    projectTrend,
    shortlistTrend,
    leadTrend,
  ] = await Promise.all([
    FeaturedProject.countDocuments(portfolioMatch),
    FeaturedProject.aggregate([
      { $match: portfolioMatch },
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ["$meta.views", 0] } },
          totalInquiries: { $sum: { $ifNull: ["$meta.inquiries", 0] } },
          totalClicks: { $sum: { $ifNull: ["$meta.clicks", 0] } },
          totalUnits: { $sum: { $ifNull: ["$totalUnits", 0] } },
          availableUnits: { $sum: { $ifNull: ["$availableUnits", 0] } },
        },
      },
    ]),
    FeaturedProject.countDocuments(featuredPortfolioMatch),
    FeaturedProject.aggregate([
      { $match: portfolioMatch },
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    FeaturedProject.aggregate([
      { $match: portfolioMatch },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    FeaturedProject.find(portfolioMatch)
      .sort({ "meta.views": -1, createdAt: -1 })
      .limit(5)
      .select(
        "title city state status isFeatured heroImage image gallerySummary meta.views meta.inquiries meta.clicks meta.shortlists createdAt",
      )
      .lean(),
    FeaturedProject.aggregate([
      { $match: portfolioMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Shortlist.aggregate([
      { $match: { propertyType: "FeaturedProject", createdAt: createdAtFilter } },
      {
        $lookup: {
          from: "featuredprojects",
          localField: "propertyId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      { $match: shortlistProjectMatch },
      { $count: "total" },
    ]),
    Promise.all([
      Lead.aggregate([
        { $match: { createdAt: createdAtFilter } },
        {
          $lookup: {
            from: "featuredprojects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        { $match: shortlistProjectMatch },
        { $count: "total" },
      ]),
      publicLeadsCollection
        .aggregate([
          { $match: { createdAt: createdAtFilter } },
          {
            $lookup: {
              from: "featuredprojects",
              localField: "projectId",
              foreignField: "_id",
              as: "project",
            },
          },
          { $unwind: "$project" },
          { $match: shortlistProjectMatch },
          { $count: "total" },
        ])
        .toArray(),
    ]),
    FeaturedProject.aggregate([
      { $match: rangeMatch },
      {
        $group: {
          _id:
            useHourlyTrend
              ? {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                  hour: { $hour: "$createdAt" },
                }
              : {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]),
    Shortlist.aggregate([
      { $match: { propertyType: "FeaturedProject", createdAt: createdAtFilter } },
      {
        $lookup: {
          from: "featuredprojects",
          localField: "propertyId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      { $match: shortlistProjectMatch },
      {
        $group: {
          _id:
            useHourlyTrend
              ? {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                  hour: { $hour: "$createdAt" },
                }
              : {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]),
    Promise.all([
      Lead.aggregate([
        { $match: { createdAt: createdAtFilter } },
        {
          $lookup: {
            from: "featuredprojects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        { $match: shortlistProjectMatch },
        {
          $group: {
            _id:
              useHourlyTrend
                ? {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                    hour: { $hour: "$createdAt" },
                  }
                : {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                  },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
      ]),
      publicLeadsCollection
        .aggregate([
          { $match: { createdAt: createdAtFilter } },
          {
            $lookup: {
              from: "featuredprojects",
              localField: "projectId",
              foreignField: "_id",
              as: "project",
            },
          },
          { $unwind: "$project" },
          { $match: shortlistProjectMatch },
          {
            $group: {
              _id:
                useHourlyTrend
                  ? {
                      year: { $year: "$createdAt" },
                      month: { $month: "$createdAt" },
                      day: { $dayOfMonth: "$createdAt" },
                      hour: { $hour: "$createdAt" },
                    }
                  : {
                      year: { $year: "$createdAt" },
                      month: { $month: "$createdAt" },
                      day: { $dayOfMonth: "$createdAt" },
                    },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
        ])
        .toArray(),
    ]),
  ]);

  const totalViews = totals[0]?.totalViews || 0;
  const totalInquiries = totals[0]?.totalInquiries || 0;
  const totalClicks = totals[0]?.totalClicks || 0;
  const totalUnits = totals[0]?.totalUnits || 0;
  const availableUnits = totals[0]?.availableUnits || 0;
  const soldUnits = Math.max(0, totalUnits - availableUnits);
  const inventorySoldShare = totalUnits > 0 ? Number(((soldUnits / totalUnits) * 100).toFixed(1)) : 0;
  const totalShortlists = shortlistTotal[0]?.total || 0;
  const totalLeads =
    (leadTotal[0]?.[0]?.total || 0) +
    (leadTotal[1]?.[0]?.total || 0);

  const statusSummary = {
    active: 0,
    inactive: 0,
    archived: 0,
  };

  for (const item of statusStats) {
    if (item?._id === "active") statusSummary.active = item.count;
    if (item?._id === "inactive") statusSummary.inactive = item.count;
    if (item?._id === "archived") statusSummary.archived = item.count;
  }

  const averageViewsPerProject =
    totalProjects > 0 ? Math.round(totalViews / totalProjects) : 0;
  const averageShortlistsPerProject =
    totalProjects > 0 ? Number((totalShortlists / totalProjects).toFixed(2)) : 0;
  const averageLeadsPerProject =
    totalProjects > 0 ? Number((totalLeads / totalProjects).toFixed(2)) : 0;
  const topCity = getTopBucket(cityStats);
  const topState = getTopBucket(stateStats);
  const topViewedProject = topViewed[0]
    ? {
        _id: String(topViewed[0]._id),
        title: topViewed[0].title,
        city: topViewed[0].city,
        state: topViewed[0].state,
        status: topViewed[0].status,
        views: topViewed[0].meta?.views || 0,
        inquiries: topViewed[0].meta?.inquiries || 0,
        shareOfViews:
          totalViews > 0
            ? Number((((topViewed[0].meta?.views || 0) / totalViews) * 100).toFixed(2))
            : 0,
      }
    : null;
  const projectsTrendFormatted = formatTrend(projectTrend);
  const shortlistsTrendFormatted = formatTrend(shortlistTrend);
  const combinedLeadTrend = new Map<string, number>();

  for (const trendGroup of leadTrend) {
    for (const item of trendGroup) {
      const key = JSON.stringify(item._id);
      combinedLeadTrend.set(key, (combinedLeadTrend.get(key) ?? 0) + (item.count ?? 0));
    }
  }

  const leadsTrendFormatted = formatTrend(
    Array.from(combinedLeadTrend.entries()).map(([key, count]) => ({
      _id: JSON.parse(key),
      count,
    })),
  );
  const mergedTrend = projectsTrendFormatted.map((item, index) => ({
    label: item.label,
    projects: item.count,
    shortlists: shortlistsTrendFormatted[index]?.count || 0,
    leads: leadsTrendFormatted[index]?.count || 0,
  }));
  const bestTrendPoint = mergedTrend.reduce<{
    label: string | null;
    type: "projects" | "shortlists" | "leads" | null;
    count: number;
  }>(
    (best, point) => {
      const candidates: Array<{ type: "projects" | "shortlists" | "leads"; count: number }> = [
        { type: "projects", count: point.projects },
        { type: "shortlists", count: point.shortlists },
        { type: "leads", count: point.leads },
      ];

      for (const candidate of candidates) {
        if (candidate.count > best.count) {
          return {
            label: point.label,
            type: candidate.type,
            count: candidate.count,
          };
        }
      }

      return best;
    },
    { label: null, type: null, count: 0 },
  );
  const lastActiveTrendPoint = [...mergedTrend]
    .reverse()
    .find((point) => point.projects > 0 || point.shortlists > 0 || point.leads > 0);

  const conversionRates = {
    viewsToShortlists: totalViews > 0 ? Number(((totalShortlists / totalViews) * 100).toFixed(2)) : 0,
    shortlistsToLeads: totalShortlists > 0 ? Number(((totalLeads / totalShortlists) * 100).toFixed(2)) : 0,
    overallConversion: totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(2)) : 0,
  };

  return {
    builderSummary: {
      totalProjects,
      totalViews,
      totalClicks,
      featuredProjects,
      primeProjects: 0,
      sponsoredProjects: 0,
      totalShortlists,
      totalLeads,
      totalInquiries,
      averageViewsPerProject,
      averageShortlistsPerProject,
      averageLeadsPerProject,
      totalUnits,
      availableUnits,
      soldUnits,
      inventorySoldShare,
      conversionRates,
    },
    statusSummary,
    engagementSummary: {
      totalViews,
      totalShortlists,
      totalLeads,
      totalInquiries,
      averageViewsPerProject,
      averageShortlistsPerProject,
      averageLeadsPerProject,
      totalClicks,
      totalUnits,
      availableUnits,
      soldUnits,
      inventorySoldShare,
      conversionRates,
    },
    locationStats: {
      cities: cityStats,
      states: stateStats,
    },
    rankingSummary: {
      topCity: topCity
        ? {
            ...topCity,
            shareOfProjects:
              totalProjects > 0 ? Number(((topCity.count / totalProjects) * 100).toFixed(2)) : 0,
          }
        : null,
      topState: topState
        ? {
            ...topState,
            shareOfProjects:
              totalProjects > 0 ? Number(((topState.count / totalProjects) * 100).toFixed(2)) : 0,
          }
        : null,
      topViewedProject,
      citySpread: cityStats.length,
      stateSpread: stateStats.length,
    },
    portfolioInsights: {
      topSellingCoverage:
        totalProjects > 0 ? Number(((featuredProjects / totalProjects) * 100).toFixed(2)) : 0,
      marketDepth: cityStats.length + stateStats.length,
      engagementLevel:
        totalViews > 0 || totalShortlists > 0 || totalLeads > 0
          ? totalLeads > 0
            ? "high-intent"
            : totalShortlists > 0
              ? "warming-up"
              : "visibility-only"
          : "just-started",
      leadReadiness:
        totalShortlists > 0 || totalInquiries > 0 || totalLeads > 0 ? "active" : "early",
    },
    trendStats: {
      range,
      projectsCreated: projectsTrendFormatted,
      shortlists: shortlistsTrendFormatted,
      leads: leadsTrendFormatted,
      summary: {
        hasActivity: mergedTrend.some(
          (point) => point.projects > 0 || point.shortlists > 0 || point.leads > 0,
        ),
        totalProjectMoments: projectsTrendFormatted.reduce((sum, item) => sum + item.count, 0),
        totalShortlistMoments: shortlistsTrendFormatted.reduce((sum, item) => sum + item.count, 0),
        totalLeadMoments: leadsTrendFormatted.reduce((sum, item) => sum + item.count, 0),
        bestDayOrSlot: bestTrendPoint.label,
        strongestSignal: bestTrendPoint.type,
        strongestSignalCount: bestTrendPoint.count,
        latestActiveLabel: lastActiveTrendPoint?.label || null,
      },
    },
    filterOptions: {
      states: availableStates,
      citiesByState,
    },
    topViewed,
  };
};

export const getBuilderFeaturedProjectShortlists = async (builderId: string) => {
  const builderObjectId = new mongoose.Types.ObjectId(builderId);

  return Shortlist.aggregate([
    {
      $match: {
        propertyType: "FeaturedProject",
      },
    },
    {
      $lookup: {
        from: "featuredprojects",
        localField: "propertyId",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    {
      $match: {
        "project.createdBy": builderObjectId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "shortlistedBy",
      },
    },
    {
      $unwind: {
        path: "$shortlistedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "shortlistedBy.roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        propertyType: 1,
        project: {
          _id: "$project._id",
          title: "$project.title",
          slug: "$project.slug",
          heroImage: "$project.heroImage",
          gallerySummary: "$project.gallerySummary",
          address: "$project.address",
          locality: "$project.locality",
          city: "$project.city",
          state: "$project.state",
          priceFrom: "$project.priceFrom",
          priceTo: "$project.priceTo",
          isFeatured: "$project.isFeatured",
          createdAt: "$project.createdAt",
        },
        shortlistedBy: {
          _id: "$shortlistedBy._id",
          name: "$shortlistedBy.name",
          email: "$shortlistedBy.email",
          phone: "$shortlistedBy.phone",
          city: "$shortlistedBy.city",
          locality: "$shortlistedBy.locality",
          userCode: "$shortlistedBy.userCode",
          role: {
            $ifNull: ["$role.label", "$role.name"],
          },
        },
      },
    },
  ]);
};

export const getBuilderProjectActivity = async (
  builderId: string,
  projectId: string,
  accessibleProjectIds?: string[],
) => {
  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new Error("Invalid builderId");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const builderObjectId = new mongoose.Types.ObjectId(builderId);
  const projectObjectId = new mongoose.Types.ObjectId(projectId);

  if (
    Array.isArray(accessibleProjectIds) &&
    accessibleProjectIds.length > 0 &&
    !accessibleProjectIds.includes("*") &&
    !accessibleProjectIds.includes(String(projectId))
  ) {
    const accessError = new Error("Project access denied");
    (accessError as any).statusCode = 403;
    throw accessError;
  }

  const project = await FeaturedProject.findOne({
    _id: projectObjectId,
    createdBy: builderObjectId,
  })
    .select(
      "_id title slug heroImage address locality city state priceFrom priceTo brochure meta",
    )
    .lean();

  if (!project) {
    const notFoundError = new Error("Project not found");
    (notFoundError as any).statusCode = 404;
    throw notFoundError;
  }

  const shortlistRows = await Shortlist.aggregate([
    {
      $match: {
        propertyType: "FeaturedProject",
        propertyId: projectObjectId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "user.roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        shortlisted: { $literal: true },
        shortlistedAt: "$createdAt",
        name: "$user.name",
        phone: "$user.phone",
        email: "$user.email",
        role: { $ifNull: ["$role.label", "$role.name"] },
        userCode: "$user.userCode",
      },
    },
  ]);
  const userMap = new Map<string, any>();

  for (const row of shortlistRows) {
    if (!row?.userId) continue;
    const key = String(row.userId);
    userMap.set(key, {
      userId: key,
      name: row.name || "Unknown user",
      phone: row.phone || undefined,
      email: row.email || undefined,
      role: row.role || "User",
      userCode: row.userCode || undefined,
      shortlisted: true,
      shortlistedAt: row.shortlistedAt || null,
      brochureDownloaded: false,
      brochureDownloadCount: 0,
      lastBrochureDownloadedAt: null,
      timeSpentMinutes: null,
    });
  }

  const leadCollection = mongoose.connection.collection("propertyleads");
  const brochureRows = await leadCollection
    .aggregate([
      {
        $match: {
          ownerId: builderObjectId,
          projectId: projectObjectId,
          $or: [{ source: "brochure" }, { source: "brochure_download" }],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$createdBy",
          brochureDownloadCount: { $sum: 1 },
          lastBrochureDownloadedAt: { $first: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          brochureDownloadCount: 1,
          lastBrochureDownloadedAt: 1,
        },
      },
    ])
    .toArray();

  for (const row of brochureRows) {
    if (!row?.userId) continue;
    const key = String(row.userId);
    const existing = userMap.get(key);
    if (!existing) continue;

    userMap.set(key, {
      ...existing,
      brochureDownloaded: (row.brochureDownloadCount ?? 0) > 0,
      brochureDownloadCount: row.brochureDownloadCount ?? 0,
      lastBrochureDownloadedAt: row.lastBrochureDownloadedAt || null,
    });
  }

  const projectViewDurationCollection = mongoose.connection.collection("projectviewdurations");
  const durationRows = await projectViewDurationCollection
    .aggregate([
      {
        $match: {
          projectId: projectObjectId,
          builderId: builderObjectId,
        },
      },
      {
        $group: {
          _id: "$userId",
          totalDurationMs: { $sum: { $ifNull: ["$durationMs", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          totalDurationMs: 1,
        },
      },
    ])
    .toArray();

  for (const row of durationRows) {
    if (!row?.userId) continue;
    const key = String(row.userId);
    const existing = userMap.get(key);
    if (!existing) continue;

    userMap.set(key, {
      ...existing,
      timeSpentMinutes: Number(((row.totalDurationMs ?? 0) / 60000).toFixed(1)),
    });
  }

  const users = Array.from(userMap.values()).sort((a, b) => {
    const aShortlist = a.shortlistedAt ? new Date(a.shortlistedAt).getTime() : 0;
    const bShortlist = b.shortlistedAt ? new Date(b.shortlistedAt).getTime() : 0;

    return bShortlist - aShortlist;
  });

  const shortlistedUsers = users.filter((user) => user.shortlisted).length;

  return {
    success: true,
    project: {
      _id: String(project._id),
      title: project.title,
      slug: project.slug,
      heroImage: project.heroImage,
      address: project.address,
      locality: project.locality,
      city: project.city,
      state: project.state,
      priceFrom: project.priceFrom,
      priceTo: project.priceTo,
      brochure: project.brochure
        ? {
            url: project.brochure.url,
            filename: project.brochure.filename,
          }
        : null,
    },
    summary: {
      totalUsers: users.length,
      shortlistedUsers,
    },
    users,
  };
};

export const getBuilderNotificationsFeed = async (
  builderId: string,
  accessibleProjectIds?: string[],
) => {
  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new Error("Invalid builderId");
  }

  const builderObjectId = new mongoose.Types.ObjectId(builderId);
  const cutoffDate = getNotificationCutoffDate();
  const projectMatch: Record<string, unknown> = {
    createdBy: builderObjectId,
  };

  if (
    Array.isArray(accessibleProjectIds) &&
    accessibleProjectIds.length > 0 &&
    !accessibleProjectIds.includes("*")
  ) {
    const validProjectIds = accessibleProjectIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    projectMatch._id = { $in: validProjectIds };
  }

  const projects = await FeaturedProject.find(projectMatch)
    .select("_id title slug heroImage meta")
    .lean();

  if (!projects.length) {
    const viewer = await User.findById(builderId)
      .select("notificationSeenAt.builder")
      .lean();
    const lastSeenAt = viewer?.notificationSeenAt?.builder ?? null;

    return {
      success: true,
      data: [],
      summary: createNotificationSummary([], lastSeenAt),
    };
  }

  const projectIds = projects.map((project) => project._id);
  const projectMap = new Map(
    projects.map((project) => [String(project._id), project]),
  );

  const shortlistRows = await Shortlist.aggregate([
    {
      $match: {
        propertyType: "FeaturedProject",
        propertyId: { $in: projectIds },
        createdAt: { $gte: cutoffDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "user.roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        propertyId: 1,
        userId: "$user._id",
        userName: "$user.name",
        userPhone: "$user.phone",
        userEmail: "$user.email",
        userCode: "$user.userCode",
        userRole: { $ifNull: ["$role.label", "$role.name"] },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const brochureCollection = mongoose.connection.collection("brochuredownloads");
  const brochureRows = await brochureCollection
    .aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          source: "brochure_download",
          createdAt: { $gte: cutoffDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "user.roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          projectId: "$projectId",
          userId: "$user._id",
          userName: "$user.name",
          userPhone: "$user.phone",
          userEmail: "$user.email",
          userCode: "$user.userCode",
          userRole: { $ifNull: ["$role.label", "$role.name"] },
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  const projectLeadRows = await Lead.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        createdAt: { $gte: cutoffDate },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "user.roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        projectId: 1,
        userId: "$user._id",
        userName: "$user.name",
        userPhone: "$user.phone",
        userEmail: "$user.email",
        userCode: "$user.userCode",
        userRole: { $ifNull: ["$role.label", "$role.name"] },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const publicLeadCollection = mongoose.connection.collection("publicleads");
  const publicLeadRows = await publicLeadCollection
    .aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          createdAt: { $gte: cutoffDate },
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          projectId: 1,
          userId: null,
          userName: "$name",
          userPhone: "$phone",
          userEmail: "$email",
          userCode: null,
          userRole: { $literal: "User" },
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  const projectViewDurationCollection = mongoose.connection.collection("projectviewdurations");
  const timeSpentRows = await projectViewDurationCollection
    .aggregate([
      {
        $match: {
          builderId: builderObjectId,
          projectId: { $in: projectIds },
          createdAt: { $gte: cutoffDate },
        },
      },
      {
        $group: {
          _id: {
            projectId: "$projectId",
            userId: "$userId",
          },
          totalDurationMs: { $sum: { $ifNull: ["$durationMs", 0] } },
          lastViewedAt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "user.roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      {
        $unwind: {
          path: "$role",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          projectId: "$_id.projectId",
          userId: "$user._id",
          userName: "$user.name",
          userPhone: "$user.phone",
          userEmail: "$user.email",
          userCode: "$user.userCode",
          userRole: { $ifNull: ["$role.label", "$role.name"] },
          totalDurationMs: 1,
          lastViewedAt: 1,
        },
      },
      { $sort: { lastViewedAt: -1 } },
    ])
    .toArray();

  const notifications: Array<Record<string, unknown>> = [];

  shortlistRows.forEach((row) => {
    const project = projectMap.get(String(row.propertyId));
    if (!project) return;
    const resolvedUser = {
      id: row.userId ? String(row.userId) : "",
      name: row.userName || "Unknown user",
      phone: row.userPhone || "No phone",
      email: row.userEmail || "No email",
      role: row.userRole || "User",
      userCode: row.userCode || "No code",
    };

    notifications.push({
      id: `shortlist-${row._id}`,
      type: "project_shortlisted",
      createdAt: row.createdAt ?? null,
      user: resolvedUser,
      project: {
        id: String(project._id),
        title: project.title || "Untitled Project",
        slug: project.slug,
      },
      message: `${row.userName || "Unknown user"} shortlisted ${project.title || "Untitled Project"}`,
      timeSpentMinutes: null,
    });
  });

  timeSpentRows.forEach((row) => {
    const project = projectMap.get(String(row.projectId));
    if (!project) return;

    const timeSpentMinutes = Number(((row.totalDurationMs ?? 0) / 60000).toFixed(1));
    if (!(timeSpentMinutes > 0)) return;

    notifications.push({
      id: `time-${String(row.projectId)}-${String(row.userId || "unknown")}`,
      type: "high_time_spent",
      createdAt: row.lastViewedAt ?? null,
      user: {
        id: row.userId ? String(row.userId) : "",
        name: row.userName || "Unknown user",
        phone: row.userPhone || "No phone",
        email: row.userEmail || "No email",
        role: row.userRole || "User",
        userCode: row.userCode || "No code",
      },
      project: {
        id: String(project._id),
        title: project.title || "Untitled Project",
        slug: project.slug,
      },
      message: `${row.userName || "Unknown user"} spent ${timeSpentMinutes} min on ${project.title || "Untitled Project"}`,
      timeSpentMinutes,
    });
  });

  brochureRows.forEach((row) => {
    const project = projectMap.get(String(row.projectId));
    if (!project) return;
    if (row.userId && String(row.userId) === String(builderObjectId)) return;

    notifications.push({
      id: `brochure-${row._id}`,
      type: "brochure_downloaded",
      createdAt: row.createdAt ?? null,
      user: {
        id: row.userId ? String(row.userId) : "",
        name: row.userName || "Unknown user",
        phone: row.userPhone || "No phone",
        email: row.userEmail || "No email",
        role: row.userRole || "User",
        userCode: row.userCode || "No code",
      },
      project: {
        id: String(project._id),
        title: project.title || "Untitled Project",
        slug: project.slug,
      },
      message: `${row.userName || "Unknown user"} downloaded the brochure for ${project.title || "Untitled Project"}`,
      timeSpentMinutes: null,
    });
  });

  [...projectLeadRows, ...publicLeadRows].forEach((row) => {
    const project = projectMap.get(String(row.projectId));
    if (!project) return;

    notifications.push({
      id: `contact-${row._id}`,
      type: "contact_requested",
      createdAt: row.createdAt ?? null,
      user: {
        id: row.userId ? String(row.userId) : "",
        name: row.userName || "Unknown user",
        phone: row.userPhone || "No phone",
        email: row.userEmail || "No email",
        role: row.userRole || "User",
        userCode: row.userCode || "No code",
      },
      project: {
        id: String(project._id),
        title: project.title || "Untitled Project",
        slug: project.slug,
      },
      message: `${row.userName || "Unknown user"} contacted you for ${project.title || "Untitled Project"}`,
      timeSpentMinutes: null,
    });
  });
  notifications.sort((a, b) => {
    const aTime = a.createdAt ? new Date(String(a.createdAt)).getTime() : 0;
    const bTime = b.createdAt ? new Date(String(b.createdAt)).getTime() : 0;
    return bTime - aTime;
  });

  const viewer = await User.findById(builderId)
    .select("notificationSeenAt.builder")
    .lean();
  const lastSeenAt = viewer?.notificationSeenAt?.builder ?? null;

  return {
    success: true,
    data: notifications,
    summary: createNotificationSummary(notifications as NotificationFeedItem[], lastSeenAt),
  };
};

type NotificationFeedItem = {
  id: string;
  type:
    | "project_shortlisted"
    | "property_shortlisted"
    | "contact_requested"
    | "brochure_downloaded"
    | "high_time_spent";
  createdAt?: Date | string | null;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    userCode?: string;
  };
  project?: {
    id?: string;
    title?: string;
    slug?: string;
  };
  message?: string;
  timeSpentMinutes?: number | null;
};

const getUnreadNotificationCount = (
  notifications: NotificationFeedItem[],
  lastSeenAt?: Date | string | null,
) => {
  const seenAtMs = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;

  return notifications.filter((item) => {
    const createdAtMs = item.createdAt ? new Date(String(item.createdAt)).getTime() : 0;
    return createdAtMs > seenAtMs;
  }).length;
};

const createNotificationSummary = (
  notifications: NotificationFeedItem[],
  lastSeenAt?: Date | string | null,
) => ({
  total: notifications.length,
  unread: getUnreadNotificationCount(notifications, lastSeenAt),
  shortlists: notifications.filter(
    (item) =>
      item.type === "project_shortlisted" || item.type === "property_shortlisted",
  ).length,
  brochureDownloads: notifications.filter(
    (item) => item.type === "brochure_downloaded",
  ).length,
  contacts: notifications.filter((item) => item.type === "contact_requested").length,
  timeSpent: notifications.filter((item) => item.type === "high_time_spent").length,
});

const sortNotifications = (notifications: NotificationFeedItem[]) => {
  notifications.sort((a, b) => {
    const aTime = a.createdAt ? new Date(String(a.createdAt)).getTime() : 0;
    const bTime = b.createdAt ? new Date(String(b.createdAt)).getTime() : 0;
    return bTime - aTime;
  });

  return notifications;
};

const createProjectPayload = (input: {
  id: string;
  slug?: string;
  title: string;
}) => ({
  id: input.id,
  title: input.title,
  ...(input.slug ? { slug: input.slug } : {}),
});

const getPropertyOwnerNotifications = async (ownerId: string) => {
  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new Error("Invalid ownerId");
  }

  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
  const cutoffDate = getNotificationCutoffDate();
  const propertyModels = [
    {
      shortlistPropertyTypes: ["Residential"],
      leadPropertyTypes: ["residentials"],
      model: Residential,
    },
    {
      shortlistPropertyTypes: ["Commercial"],
      leadPropertyTypes: ["commercials"],
      model: Commercial,
    },
    {
      shortlistPropertyTypes: ["Land", "LandPlot"],
      leadPropertyTypes: ["landplots"],
      model: LandPlot,
    },
    {
      shortlistPropertyTypes: ["Agricultural"],
      leadPropertyTypes: ["agriculturals"],
      model: Agricultural,
    },
  ] as const;

  const notifications: NotificationFeedItem[] = [];

  await Promise.all(
    propertyModels.map(async ({ shortlistPropertyTypes, leadPropertyTypes, model }) => {
      const properties = await (model as any)
        .find({ createdBy: ownerObjectId })
        .select("_id title slug projectName buildingName")
        .lean();

      if (!properties.length) return;

      const propertyIds = properties.map((property: any) => property._id);
      const propertyMap = new Map(
        properties.map((property: any) => [
          String(property._id),
          property.title || property.projectName || property.buildingName || "Untitled Property",
        ]),
      );

      const shortlistRows = await Shortlist.aggregate([
        {
          $match: {
            propertyType: { $in: shortlistPropertyTypes },
            propertyId: { $in: propertyIds },
            createdAt: { $gte: cutoffDate },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.roleId",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $unwind: {
            path: "$role",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            propertyId: 1,
            userId: "$user._id",
            userName: "$user.name",
            userPhone: "$user.phone",
            userEmail: "$user.email",
            userCode: "$user.userCode",
            userRole: { $ifNull: ["$role.label", "$role.name"] },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      shortlistRows.forEach((row) => {
        const propertyTitle = propertyMap.get(String(row.propertyId));
        if (!propertyTitle) return;
        if (row.userId && String(row.userId) === String(ownerObjectId)) return;

        notifications.push({
          id: `property-shortlist-${shortlistPropertyTypes.join("-")}-${row._id}`,
          type: "property_shortlisted",
          createdAt: row.createdAt ?? null,
          user: {
            id: row.userId ? String(row.userId) : "",
            name: row.userName || "Unknown user",
            phone: row.userPhone || "No phone",
            email: row.userEmail || "No email",
            role: row.userRole || "User",
            userCode: row.userCode || "No code",
          },
          project: createProjectPayload({
            id: String(row.propertyId),
            title: String(propertyTitle),
          }),
          message: `${row.userName || "Unknown user"} shortlisted ${propertyTitle}`,
          timeSpentMinutes: null,
        });
      });

      const leadRows = await mongoose.connection
        .collection("propertyleads")
        .aggregate([
          {
            $match: {
              ownerId: ownerObjectId,
              propertyType: { $in: leadPropertyTypes },
              projectId: { $in: propertyIds },
              createdAt: { $gte: cutoffDate },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "roles",
              localField: "user.roleId",
              foreignField: "_id",
              as: "role",
            },
          },
          {
            $unwind: {
              path: "$role",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              createdAt: 1,
              projectId: 1,
              userId: "$user._id",
              userName: "$user.name",
              userPhone: "$user.phone",
              userEmail: "$user.email",
              userCode: "$user.userCode",
              userRole: { $ifNull: ["$role.label", "$role.name"] },
            },
          },
          { $sort: { createdAt: -1 } },
        ])
        .toArray();

      leadRows.forEach((row) => {
        const propertyTitle = propertyMap.get(String(row.projectId));
        if (!propertyTitle) return;
        if (row.userId && String(row.userId) === String(ownerObjectId)) return;

        notifications.push({
          id: `property-contact-${leadPropertyTypes.join("-")}-${row._id}`,
          type: "contact_requested",
          createdAt: row.createdAt ?? null,
          user: {
            id: row.userId ? String(row.userId) : "",
            name: row.userName || "Unknown user",
            phone: row.userPhone || "No phone",
            email: row.userEmail || "No email",
            role: row.userRole || "User",
            userCode: row.userCode || "No code",
          },
          project: createProjectPayload({
            id: String(row.projectId),
            title: String(propertyTitle),
          }),
          message: `${row.userName || "Unknown user"} contacted you for ${propertyTitle}`,
          timeSpentMinutes: null,
        });
      });

      const timeSpentRows = await mongoose.connection
        .collection("projectviewdurations")
        .aggregate([
          {
            $match: {
              ownerId: ownerObjectId,
              propertyType: { $in: leadPropertyTypes },
              projectId: { $in: propertyIds },
              createdAt: { $gte: cutoffDate },
            },
          },
          {
            $group: {
              _id: {
                projectId: "$projectId",
                userId: "$userId",
              },
              totalDurationMs: { $sum: { $ifNull: ["$durationMs", 0] } },
              lastViewedAt: { $max: "$createdAt" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id.userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "roles",
              localField: "user.roleId",
              foreignField: "_id",
              as: "role",
            },
          },
          {
            $unwind: {
              path: "$role",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              projectId: "$_id.projectId",
              userId: "$user._id",
              userName: "$user.name",
              userPhone: "$user.phone",
              userEmail: "$user.email",
              userCode: "$user.userCode",
              userRole: { $ifNull: ["$role.label", "$role.name"] },
              totalDurationMs: 1,
              lastViewedAt: 1,
            },
          },
          { $sort: { lastViewedAt: -1 } },
        ])
        .toArray();

      timeSpentRows.forEach((row) => {
        const propertyTitle = propertyMap.get(String(row.projectId));
        if (!propertyTitle) return;
        if (row.userId && String(row.userId) === String(ownerObjectId)) return;

        const timeSpentMinutes = Number(((row.totalDurationMs ?? 0) / 60000).toFixed(1));
        if (!(timeSpentMinutes > 0)) return;

        notifications.push({
          id: `property-time-${leadPropertyTypes.join("-")}-${String(row.projectId)}-${String(row.userId || "unknown")}`,
          type: "high_time_spent",
          createdAt: row.lastViewedAt ?? null,
          user: {
            id: row.userId ? String(row.userId) : "",
            name: row.userName || "Unknown user",
            phone: row.userPhone || "No phone",
            email: row.userEmail || "No email",
            role: row.userRole || "User",
            userCode: row.userCode || "No code",
          },
          project: createProjectPayload({
            id: String(row.projectId),
            title: String(propertyTitle),
          }),
          message: `${row.userName || "Unknown user"} spent ${timeSpentMinutes} min on ${propertyTitle}`,
          timeSpentMinutes,
        });
      });
    }),
  );

  return sortNotifications(notifications);
};

export const getAgentNotificationsFeed = async (agentUserId: string) => {
  const notifications = await getPropertyOwnerNotifications(agentUserId);
  const viewer = await User.findById(agentUserId)
    .select("notificationSeenAt.agent")
    .lean();
  const lastSeenAt = viewer?.notificationSeenAt?.agent ?? null;

  return {
    success: true,
    data: notifications,
    summary: createNotificationSummary(notifications, lastSeenAt),
  };
};

export const getAgentNotificationsSummary = async (agentUserId: string) => {
  const feed = await getAgentNotificationsFeed(agentUserId);
  return {
    success: true,
    summary: feed.summary,
  };
};

export const getUserNotificationsFeed = async (userId: string) => {
  const notifications = await getPropertyOwnerNotifications(userId);
  const viewer = await User.findById(userId)
    .select("notificationSeenAt.user")
    .lean();
  const lastSeenAt = viewer?.notificationSeenAt?.user ?? null;

  return {
    success: true,
    data: notifications,
    summary: createNotificationSummary(notifications, lastSeenAt),
  };
};

export const getUserNotificationsSummary = async (userId: string) => {
  const feed = await getUserNotificationsFeed(userId);
  return {
    success: true,
    summary: feed.summary,
  };
};

export const getBuilderNotificationsSummary = async (
  builderId: string,
  allowedProjectIds: string[] = ["*"],
) => {
  const feed = await getBuilderNotificationsFeed(builderId, allowedProjectIds);
  return {
    success: true,
    summary: feed.summary,
  };
};

export const markNotificationFeedSeen = async (
  userId: string,
  audience: "builder" | "agent" | "user",
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      [`notificationSeenAt.${audience}`]: new Date(),
    },
  });

  return { success: true };
};
