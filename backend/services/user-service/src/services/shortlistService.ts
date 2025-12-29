import { Types } from "mongoose";
import Shortlist from "../models/shortlistModel";


export const addToShortlistService = async (
  userId: Types.ObjectId,
  propertyId: string,
  propertyType: "Residential" | "Commercial" | "Land" | "Agricultural",
) => {
  const propertyObjectId = new Types.ObjectId(propertyId);

  return await (Shortlist.findOneAndUpdate as any)(
    { userId, propertyId: propertyObjectId, propertyType},
    {},
    { upsert: true, new: true }
  );
};

export const removeFromShortlistService = async (
  userId: string,
  propertyId: string
) => {
  return await (Shortlist.findOneAndUpdate as any)({ userId, propertyId });
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
              from: "lands",
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



export const getShortlistStatusService = async (userId: string, propertyId: string) => {
  const exists = await Shortlist.exists({ userId, propertyId });
  return Boolean(exists);
};
