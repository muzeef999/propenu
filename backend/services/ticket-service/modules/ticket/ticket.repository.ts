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
    if (query.ownedBy) {
      const ownerId = String(query.ownedBy).trim();
      if (ownerId) {
        filter.$or = [
          { "assignedTo.userId": ownerId },
          { "metadata.createdByUserId": ownerId },
          { "metadata.involvedAssigneeIds": ownerId },
          { tags: `created_by_${ownerId}` },
          { tags: `involved_${ownerId}` },
        ];
      }
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
    const openStatuses = [
      "open",
      "assigned",
      "under_review",
      "awaiting_user_response",
      "in_progress",
      "escalated",
      "reopened",
      "waiting_for_customer",
      "waiting_for_internal_team",
    ];

    if (query.openBucket) {
      filter.status = { $in: openStatuses };
    }
    if (query.unassigned) {
      filter.status = { $in: openStatuses };
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [
            { assignedTo: { $exists: false } },
            { "assignedTo.userId": { $exists: false } },
            { "assignedTo.userId": null },
            { "assignedTo.userId": "" },
          ],
        },
      ];
    }
    if (query.overdue) {
      filter.dueAt = { $lt: new Date() };
      filter.status = { $in: openStatuses };
    }
    if (query.reassigned) {
      filter.status = { $in: openStatuses };
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        {
          $or: [
            { "metadata.lastReassignedAt": { $exists: true, $nin: [null, ""] } },
            { "metadata.lastReassignedFrom": { $exists: true, $nin: [null, ""] } },
            { "metadata.involvedAssigneeIds.0": { $exists: true } },
          ],
        },
      ];
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
