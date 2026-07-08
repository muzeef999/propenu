import { closedTicketStatuses } from "./ticket.constants";
import { TicketRepository } from "./ticket.repository";
import type {
  CreateTicketInput,
  TicketActor,
  TicketAttachment,
  TicketActivity,
  TicketListQuery,
  TicketPriority,
  TicketStatus,
  UpdateTicketInput,
} from "./ticket.interface";

const cleanTags = (tags?: string[]) =>
  Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  );

const activity = (
  action: string,
  message: string,
  actor?: TicketActor,
  from?: string,
  to?: string,
) => {
  const item: TicketActivity = { action, message, createdAt: new Date() };
  if (actor) item.actor = actor;
  if (from) item.from = from;
  if (to) item.to = to;
  return item;
};

const requesterActor = (input: CreateTicketInput): TicketActor => {
  const actor: TicketActor = { name: input.requester.name, role: "requester" };
  if (input.requester.userId) actor.userId = input.requester.userId;
  if (input.requester.email) actor.email = input.requester.email;
  return actor;
};

export class TicketService {
  static createTicket(input: CreateTicketInput) {
    return TicketRepository.create({
      ...input,
      priority: input.priority ?? "medium",
      source: input.source ?? "web",
      tags: cleanTags(input.tags),
      attachments: input.attachments ?? [],
      activities: [activity("ticket.created", "Ticket created", requesterActor(input))],
    });
  }

  static listTickets(query: TicketListQuery) {
    return TicketRepository.list(query);
  }

  static getTicket(id: string) {
    return TicketRepository.findById(id);
  }

  static updateTicket(id: string, input: UpdateTicketInput, actor?: TicketActor) {
    const update = {
      ...input,
      ...(input.tags ? { tags: cleanTags(input.tags) } : {}),
      $push: {
        activities: activity(
          "ticket.updated",
          "Ticket details updated",
          actor,
        ),
      },
    };

    return TicketRepository.updateById(id, update);
  }

  static deleteTicket(id: string) {
    return TicketRepository.deleteById(id);
  }

  static async changeStatus(
    id: string,
    status: TicketStatus,
    actor?: TicketActor,
    reason?: string,
  ) {
    const existing = await TicketRepository.findById(id);
    if (!existing) return null;

    const now = new Date();
    const update: Record<string, unknown> = {
      status,
      $push: {
        activities: activity(
          "ticket.status_changed",
          reason || `Status changed from ${existing.status} to ${status}`,
          actor,
          existing.status,
          status,
        ),
      },
    };

    if (status === "resolved") update.resolvedAt = now;
    if (status === "closed") update.closedAt = now;
    if (!closedTicketStatuses.has(status)) {
      update.resolvedAt = undefined;
      update.closedAt = undefined;
    }

    return TicketRepository.updateById(id, update);
  }

  static assignTicket(id: string, assignedTo: TicketActor, actor?: TicketActor) {
    return TicketRepository.updateById(id, {
      assignedTo,
      $push: {
        activities: activity(
          "ticket.assigned",
          `Ticket assigned to ${assignedTo.name || assignedTo.userId || "agent"}`,
          actor,
        ),
      },
    });
  }

  static setPriority(
    id: string,
    priority: TicketPriority,
    actor?: TicketActor,
    reason?: string,
  ) {
    return TicketRepository.updateById(id, {
      priority,
      $push: {
        activities: activity(
          "ticket.priority_changed",
          reason || `Priority changed to ${priority}`,
          actor,
        ),
      },
    });
  }

  static addComment(
    id: string,
    message: string,
    visibility: "public" | "internal",
    author?: TicketActor,
    attachments: TicketAttachment[] = [],
  ) {
    const now = new Date();
    const update: Record<string, unknown> = {
      $push: {
        comments: { message, visibility, author, attachments },
        activities: activity(
          "ticket.comment_added",
          `${visibility === "internal" ? "Internal note" : "Comment"} added`,
          author,
        ),
      },
    };

    if (author?.role === "requester" || author?.role === "customer") {
      update.lastCustomerReplyAt = now;
    } else {
      update.lastAgentReplyAt = now;
      update.firstResponseAt = now;
    }

    return TicketRepository.updateById(id, update);
  }

  static removeComment(id: string, commentId: string, actor?: TicketActor) {
    return TicketRepository.updateById(id, {
      $pull: { comments: { _id: commentId } },
      $push: {
        activities: activity("ticket.comment_removed", "Comment removed", actor),
      },
    });
  }

  static summary() {
    return TicketRepository.summary();
  }
}
