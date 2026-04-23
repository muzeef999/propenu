import mongoose, { Types } from "mongoose";
import Shortlist from "../models/shortlistModel";
import FeaturedProject from "../models/featurePropertiesModel";


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

    // 3️⃣ Merge all into one array
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
          gallerySummary: "$all.property.gallerySummary",
          heroImage: "$all.property.heroImage",
          address: "$all.property.address",
          locality: "$all.property.locality",
          city: "$all.property.city",
          price: { $ifNull: ["$all.property.price", "$all.property.priceFrom"] },
          priceFrom: "$all.property.priceFrom",
          priceTo: "$all.property.priceTo",
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



export const getBuilderAnalytics = async (builderId: string) => {
  const builderObjectId = new mongoose.Types.ObjectId(builderId);

  const match = { createdBy: builderObjectId };

  const [
    totalProjects,
    totalViews,
    featuredProjects,
    cityStats,
    stateStats,
    topViewed
  ] = await Promise.all([

    // ✅ total builder projects
    FeaturedProject.countDocuments(match),

    // ✅ total views of builder projects
    FeaturedProject.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$meta.views" }
        }
      }
    ]),

    // ✅ featured count
    FeaturedProject.countDocuments({
      ...match,
      isFeatured: true
    }),

    // ✅ city stats
    FeaturedProject.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$city",
          count: { $sum: 1 }
        }
      }
    ]),

    // ✅ state stats
    FeaturedProject.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 }
        }
      }
    ]),

    // ✅ top viewed projects of THIS builder
    FeaturedProject.find(match)
      .sort({ "meta.views": -1 })
      .limit(5)
      .select("title city meta.views")
      .lean()
  ]);

  return {
    builderSummary: {
      totalProjects,
      totalViews: totalViews[0]?.totalViews || 0,
      featuredProjects,
    },
    locationStats: {
      cities: cityStats,
      states: stateStats,
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
