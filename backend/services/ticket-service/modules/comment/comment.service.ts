import type { PipelineStage } from "mongoose";
import { Ticket } from "../ticket";
import { TicketService } from "../ticket";
import type { TicketActor, TicketAttachment } from "../ticket";

export class CommentService {
  static create(
    ticketId: string,
    payload: {
      message: string;
      visibility?: "public" | "internal";
      author?: TicketActor;
      attachments?: TicketAttachment[];
    },
  ) {
    return TicketService.addComment(
      ticketId,
      payload.message,
      payload.visibility ?? "public",
      payload.author,
      payload.attachments ?? [],
    );
  }

  static async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
    const match: Record<string, unknown> = {};

    if (typeof query.ticketId === "string") match._id = query.ticketId;
    if (typeof query.visibility === "string") match["comments.visibility"] = query.visibility;
    if (typeof query.authorId === "string") match["comments.author.userId"] = query.authorId;

    const pipeline: PipelineStage[] = [
      { $unwind: "$comments" },
      { $match: match },
      { $sort: { "comments.createdAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: "$comments._id",
          ticketId: "$_id",
          ticketTitle: "$title",
          message: "$comments.message",
          visibility: "$comments.visibility",
          author: "$comments.author",
          attachments: "$comments.attachments",
          createdAt: "$comments.createdAt",
          updatedAt: "$comments.updatedAt",
        },
      },
    ];

    const countPipeline: PipelineStage[] = [
      { $unwind: "$comments" },
      { $match: match },
      { $count: "total" },
    ];

    const [data, count] = await Promise.all([
      Ticket.aggregate(pipeline),
      Ticket.aggregate(countPipeline),
    ]);

    const total = count[0]?.total ?? 0;
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static update(ticketId: string, commentId: string, payload: { message?: string; visibility?: "public" | "internal"; actor?: TicketActor }) {
    const set: Record<string, unknown> = {};
    if (payload.message !== undefined) set["comments.$.message"] = payload.message;
    if (payload.visibility !== undefined) set["comments.$.visibility"] = payload.visibility;

    return Ticket.findOneAndUpdate(
      { _id: ticketId, "comments._id": commentId },
      {
        $set: set,
        $push: {
          activities: {
            action: "ticket.comment_updated",
            message: "Comment updated",
            actor: payload.actor,
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );
  }

  static remove(ticketId: string, commentId: string, actor?: TicketActor) {
    return TicketService.removeComment(ticketId, commentId, actor);
  }
}

