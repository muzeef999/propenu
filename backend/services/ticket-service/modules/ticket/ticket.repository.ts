import type { FilterQuery, UpdateQuery } from "mongoose";
import { Ticket } from "./ticket.model";
import type {
  CreateTicketInput,
  TicketAttrs,
  TicketDocument,
  TicketListQuery,
} from "./ticket.interface";

export class TicketRepository {
  static existsByTicketCode(ticketCode: string) {
    return Ticket.exists({ ticketCode });
  }

  static create(payload: CreateTicketInput & Partial<TicketAttrs>) {
    return Ticket.create(payload);
  }

  static findById(id: string) {
    return Ticket.findById(id);
  }

  static updateById(id: string, update: UpdateQuery<TicketDocument>) {
    return Ticket.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
  }

  static deleteById(id: string) {
    return Ticket.findByIdAndDelete(id);
  }

  static async list(query: TicketListQuery) {
    const filter: FilterQuery<TicketDocument> = {};

    if (query.q) filter.$text = { $search: query.q };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.category) filter.category = query.category;
    if (query.department) filter.department = query.department;
    if (query.assignedTo) filter["assignedTo.userId"] = query.assignedTo;
    if (query.assignedRole) filter["assignedTo.role"] = query.assignedRole;
    if (query.assignedOrRequested) {
      filter.$or = [
        { "assignedTo.userId": query.assignedOrRequested },
        { "requester.userId": query.assignedOrRequested }
      ];
    }
    if (query.requesterId) filter["requester.userId"] = query.requesterId;
    if (query.requesterEmail) filter["requester.email"] = query.requesterEmail;
    if (query.propertyId) filter.propertyId = query.propertyId;
    if (query.relatedProjectId) {
      filter["metadata.relatedProjectId"] = query.relatedProjectId;
    }
    if (query.tag) filter.tags = query.tag;
    if (query.module) filter["metadata.module"] = query.module;
    if (query.requestType) filter["metadata.requestType"] = query.requestType;
    if (query.overdue) {
      filter.dueAt = { $lt: new Date() };
      filter.status = { $nin: ["resolved", "closed"] };
    }

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) filter.createdAt.$gte = query.createdFrom;
      if (query.createdTo) filter.createdAt.$lte = query.createdTo;
    }

    const skip = (query.page - 1) * query.limit;
    const sort = { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 } as const;

    const [data, total] = await Promise.all([
      Ticket.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Ticket.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  static async summary() {
    const [byStatus, byPriority, overdue] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.countDocuments({
        dueAt: { $lt: new Date() },
        status: { $nin: ["resolved", "closed"] },
      }),
    ]);

    return { byStatus, byPriority, overdue };
  }
}
