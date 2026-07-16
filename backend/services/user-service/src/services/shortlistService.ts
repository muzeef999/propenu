import mongoose, { Types } from "mongoose";
import Shortlist from "../models/shortlistModel";
import FeaturedProject, { Lead } from "../models/featurePropertiesModel";

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
