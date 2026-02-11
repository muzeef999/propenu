import { Types } from "mongoose";
import Shortlist from "../models/shortlistModel";
import FeaturedProject from "../models/featurePropertiesModel";


export const addToShortlistService = async (
  userId: Types.ObjectId,
  propertyId: string,
  propertyType: "Residential" | "Commercial" | "Land" | "Agricultural",
) => {
  const propertyObjectId = new Types.ObjectId(propertyId);

  return await (Shortlist.findOneAndUpdate as any)(
    { userId, propertyId: propertyObjectId },
    { $set: { propertyType } },
    { upsert: true, new: true }
  );
};

export const removeFromShortlistService = async (
  userId: string,
  propertyId: string
) => {
  // Cast to any to bypass the incompatible signature union error
  return await (Shortlist.deleteOne as any)({ 
    userId: new Types.ObjectId(userId), 
    propertyId: new Types.ObjectId(propertyId) 
  }); 
};



export const getUserShortlistService = async (userId: Types.ObjectId) => {
  return Shortlist.aggregate([
    // 1️⃣ Only this user
    {
      $match: {
        userId: new Types.ObjectId(userId),
      },
    },

    // 2️⃣ Split by property type
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
      },
    },

    // 3️⃣ Merge all into one array
    {
      $project: {
        all: {
          $concatArrays: [
            "$residential",
            "$commercial",
            "$land",
            "$agricultural",
          ],
        },
      },
    },

    // 4️⃣ Flatten
    { $unwind: "$all" },

    // 5️⃣ Sort latest first
    { $sort: { "all.createdAt": -1 } },

    // 6️⃣ Final response shape
    {
      $project: {
        _id: "$all._id",
        createdAt: "$all.createdAt",
        propertyType: "$all.propertyType",
        property: {
          _id: "$all.property._id",
          title: "$all.property.title",
          gallery: "$all.property.gallery",
          address: "$all.property.address",
          price: "$all.property.price",
          city: "$all.property.city",
          slug: "$all.property.slug",
        },
      },
    },
  ]);
};



export const getShortlistStatusService = async (
  userId: string,
  propertyId: string
) => {
  const exists = await Shortlist.exists({
    userId: new Types.ObjectId(userId),
    propertyId: new Types.ObjectId(propertyId),
  });

  return Boolean(exists);
};



export const  getAnalytics =  async() => {
    const now = new Date();

  const [
    totalProjects,
    statusCounts,
    featuredCounts,
    cityStats,
    stateStats,
    topViewed,
  ] = await Promise.all([

    // 1. Total projects
    FeaturedProject.countDocuments(),

    // 2. Status split
    FeaturedProject.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 3. Featured vs non-featured
    FeaturedProject.aggregate([
      {
        $group: {
          _id: "$isFeatured",
          count: { $sum: 1 }
        }
      }
    ]),

    // 4. Projects by city + featured split
    FeaturedProject.aggregate([
      {
        $group: {
          _id: { city: "$city", featured: "$isFeatured" },
          count: { $sum: 1 }
        }
      }
    ]),

    // 5. Projects by state
    FeaturedProject.aggregate([
      {
        $group: {
          _id: "$state",
          total: { $sum: 1 },
          featured: {
            $sum: { $cond: ["$isFeatured", 1, 0] }
          }
        }
      }
    ]),

    // 6. Top 5 by views
    FeaturedProject.find()
      .sort({ "meta.views": -1 })
      .limit(5)
      .select("title city meta.views isFeatured")
      .lean()
  ]);

  return {
    totals: {
      projects: totalProjects,
    },
    status: statusCounts,
    featuredSplit: featuredCounts,
    location: {
      cities: cityStats,
      states: stateStats,
    },
    topViewed,
  };
}
