// src/controllers/analyticsController.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import Residential from "../models/residentialModel";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import FeaturedProject from "../models/featurePropertiesModel";

/* =====================================================
   HELPER
===================================================== */




async function propertyStats(match: any = {}) {
  const stats = await Residential.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },

        active: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },

        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },

        draft: {
          $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
        },

        totalViews: { $sum: "$meta.views" },
      },
    },
  ]);

  return stats[0] || {
    totalProperties: 0,
    active: 0,
    pending: 0,
    draft: 0,
    totalViews: 0,
  };
}

export const projectAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const city = req.query.city as string;

    /**
     * =========================================
     * FILTER
     * =========================================
     */

    const matchFilter: any = {};

    // Optional city filter
    if (city) {
      matchFilter.city = city;
    }

    /**
     * =========================================
     * OVERVIEW COUNTS
     * =========================================
     */

    const overviewPromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: null,

          totalProjects: {
            $sum: 1,
          },

          activeProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },

          pendingProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },

          inactiveProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
            },
          },

          rejectedProjects: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
            },
          },

          normalProjects: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $ifNull: ["$promotion.type", "normal"],
                    },
                    "normal",
                  ],
                },
                1,
                0,
              ],
            },
          },

          featuredProjects: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "featured"],
                },
                1,
                0,
              ],
            },
          },

          primeProjects: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "prime"],
                },
                1,
                0,
              ],
            },
          },

          sponsoredProjects: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "sponsored"],
                },
                1,
                0,
              ],
            },
          },

          totalViews: {
            $sum: "$meta.views",
          },

          totalInquiries: {
            $sum: "$meta.inquiries",
          },

          totalClicks: {
            $sum: "$meta.clicks",
          },
        },
      },
    ]);

    /**
     * =========================================
     * CITY WISE
     * =========================================
     */

    const cityWisePromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: "$city",

          total: {
            $sum: 1,
          },

          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },

          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },

          inactive: {
            $sum: {
              $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
            },
          },

          normal: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $ifNull: ["$promotion.type", "normal"],
                    },
                    "normal",
                  ],
                },
                1,
                0,
              ],
            },
          },

          featured: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "featured"],
                },
                1,
                0,
              ],
            },
          },

          prime: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "prime"],
                },
                1,
                0,
              ],
            },
          },

          sponsored: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "sponsored"],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },
    ]);

    /**
     * =========================================
     * CATEGORY WISE
     * =========================================
     */

    const categoryWisePromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: {
            $ifNull: ["$categoryType", "unknown"],
          },

          total: {
            $sum: 1,
          },

          normal: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $ifNull: ["$promotion.type", "normal"],
                    },
                    "normal",
                  ],
                },
                1,
                0,
              ],
            },
          },

          featured: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "featured"],
                },
                1,
                0,
              ],
            },
          },

          prime: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "prime"],
                },
                1,
                0,
              ],
            },
          },

          sponsored: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "sponsored"],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },
    ]);

    /**
     * =========================================
     * STATUS WISE
     * =========================================
     */

    const statusWisePromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: "$status",

          total: {
            $sum: 1,
          },

          normal: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $ifNull: ["$promotion.type", "normal"],
                    },
                    "normal",
                  ],
                },
                1,
                0,
              ],
            },
          },

          featured: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "featured"],
                },
                1,
                0,
              ],
            },
          },

          prime: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "prime"],
                },
                1,
                0,
              ],
            },
          },

          sponsored: {
            $sum: {
              $cond: [
                {
                  $eq: ["$promotion.type", "sponsored"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    /**
     * =========================================
     * PROPERTY TYPE WISE
     * =========================================
     */

    const propertyTypeWisePromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: "$propertyType",

          total: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          total: -1,
        },
      },
    ]);

    /**
     * =========================================
     * PRICE ANALYTICS
     * =========================================
     */

    const priceAnalyticsPromise = FeaturedProject.aggregate([
      {
        $match: matchFilter,
      },

      {
        $group: {
          _id: null,

          avgPriceFrom: {
            $avg: "$priceFrom",
          },

          avgPriceTo: {
            $avg: "$priceTo",
          },

          minPrice: {
            $min: "$priceFrom",
          },

          maxPrice: {
            $max: "$priceTo",
          },
        },
      },
    ]);

    /**
     * =========================================
     * PROMOTION WISE
     * =========================================
     */

const promotionWisePromise = FeaturedProject.aggregate([
  {
    $match: matchFilter,
  },

  /**
   * =========================================
   * GROUP BY PROMOTION + CATEGORY
   * =========================================
   */

  {
    $group: {
      _id: {
        promotionType: {
          $ifNull: ["$promotion.type", "normal"],
        },

        category: {
          $ifNull: ["$categoryType", "unknown"],
        },
      },

      total: {
        $sum: 1,
      },

      active: {
        $sum: {
          $cond: [{ $eq: ["$status", "active"] }, 1, 0],
        },
      },

      pending: {
        $sum: {
          $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
        },
      },

      inactive: {
        $sum: {
          $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
        },
      },
    },
  },

  /**
   * =========================================
   * REGROUP BY PROMOTION TYPE
   * =========================================
   */

  {
    $group: {
      _id: "$_id.promotionType",

      total: {
        $sum: "$total",
      },

      active: {
        $sum: "$active",
      },

      pending: {
        $sum: "$pending",
      },

      inactive: {
        $sum: "$inactive",
      },

      categories: {
        $push: {
          k: {
            $toString: "$_id.category",
          },

          v: "$total",
        },
      },
    },
  },

  /**
   * =========================================
   * ARRAY TO OBJECT
   * =========================================
   */

  {
    $addFields: {
      categories: {
        $arrayToObject: "$categories",
      },
    },
  },
]);


    /**
     * =========================================
     * EXECUTE ALL
     * =========================================
     */

    const [
      overview,
      cityWise,
      categoryWise,
      statusWise,
      propertyTypeWise,
      priceAnalytics,
      promotionWise,
    ] = await Promise.all([
      overviewPromise,
      cityWisePromise,
      categoryWisePromise,
      statusWisePromise,
      propertyTypeWisePromise,
      priceAnalyticsPromise,
      promotionWisePromise,
    ]);

    /**
     * =========================================
     * RESPONSE
     * =========================================
     */

    res.status(200).json({
      success: true,

      filters: {
        city: city || null,
      },

      data: {
        overview: overview[0] || {},

        cityWise,

        categoryWise,

        statusWise,

        propertyTypeWise,

        promotionWise,

        priceAnalytics: priceAnalytics[0] || {},
      },
    });
  } catch (error) {
    console.error("Project analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};



/* =====================================================
   1️⃣ SUPER ADMIN All platform stats
===================================================== */

export const getSuperAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.countDocuments();
    const agents = await User.countDocuments({ roleName: "sales_agent" });
    const managers = await User.countDocuments({ roleName: "sales_manager" });

    const properties = await propertyStats();

    res.json({
      users,
      agents,
      managers,
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   2️⃣ ADMIN Same as super admin but without users
===================================================== */

export const getAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await propertyStats();

    res.json({
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   3️⃣ SALES MANAGER  Properties of agents under manager
===================================================== */

export const getsupermanager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const managerId = new mongoose.Types.ObjectId(req.user!.id);

    const agents = await User.find({ managerId }).select("_id");

    const agentIds = agents.map((a) => a._id);

    const properties = await propertyStats({
      createdBy: { $in: agentIds },
    });

    res.json({
      totalAgents: agents.length,
      ...properties,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   4️⃣ SALES AGENT   Only his properties
===================================================== */

export const getsuperagent = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const agentId = new mongoose.Types.ObjectId(req.user!.id);

    const properties = await propertyStats({
      createdBy: agentId,
    });

    res.json(properties);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
