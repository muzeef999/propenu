import { PipelineStage } from "mongoose";
import UserInteraction from "../models/userInteractionModel";

/**
 * Older rows are one document per action. Account rows are one document per
 * user with an `actions` array. This turns both into a flat list of actions
 * so existing activity queries can stay the same.
 */
export function expandUserInteractionEvents(): PipelineStage[] {
  return [
    {
      $match: {
        $or: [
          { kind: "account" },
          {
            kind: { $ne: "account" },
            superseded: { $ne: true },
            eventType: { $type: "string" },
          },
        ],
      },
    },
    {
      $project: {
        userId: 1,
        events: {
          $cond: [
            { $eq: ["$kind", "account"] },
            { $ifNull: ["$actions", []] },
            [
              {
                _id: "$_id",
                sessionId: "$sessionId",
                eventType: "$eventType",
                eventCategory: "$eventCategory",
                entityType: "$entityType",
                projectId: "$projectId",
                propertyId: "$propertyId",
                plotId: "$plotId",
                promotionType: "$promotionType",
                promotionId: "$promotionId",
                source: "$source",
                placement: "$placement",
                pageUrl: "$pageUrl",
                previousPageUrl: "$previousPageUrl",
                metadata: "$metadata",
                searchContext: "$searchContext",
                clientTimestamp: "$clientTimestamp",
                serverTimestamp: "$serverTimestamp",
                userId: "$userId",
              },
            ],
          ],
        },
      },
    },
    { $unwind: { path: "$events", preserveNullAndEmptyArrays: false } },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            "$events",
            { userId: { $ifNull: ["$events.userId", "$userId"] } },
          ],
        },
      },
    },
  ];
}

export function aggregateInteractionEvents(pipeline: PipelineStage[]) {
  return UserInteraction.aggregate([
    ...expandUserInteractionEvents(),
    ...pipeline,
  ]);
}

export function queryInteractionEvents(
  match: Record<string, unknown>,
  options: { skip?: number; limit?: number } = {},
) {
  const pipeline: PipelineStage[] = [
    ...expandUserInteractionEvents(),
    { $match: match },
    { $sort: { serverTimestamp: -1, _id: -1 } },
  ];
  if (options.skip) pipeline.push({ $skip: options.skip });
  if (options.limit) pipeline.push({ $limit: options.limit });
  return UserInteraction.aggregate(pipeline);
}

export async function countInteractionEvents(match: Record<string, unknown>) {
  const [row] = await UserInteraction.aggregate([
    ...expandUserInteractionEvents(),
    { $match: match },
    { $count: "n" },
  ]);
  return Number(row?.n || 0);
}
