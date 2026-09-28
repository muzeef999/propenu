import type { PipelineStage } from "mongoose";
import { Ticket } from "../ticket";

const parseDate = (value: unknown, endOfDay = false) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(
      `${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`,
    );
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export class DashboardService {
  static async overview(query: Record<string, unknown>) {
    const from = parseDate(query.from || query.startDate, false);
    const to = parseDate(query.to || query.endDate, true);
    const dateMatch: Record<string, unknown> = {};

    if (from || to) {
      dateMatch.createdAt = {};
      if (from) (dateMatch.createdAt as Record<string, Date>).$gte = from;
      if (to) (dateMatch.createdAt as Record<string, Date>).$lte = to;
    }

    if (typeof query.ownedBy === "string" && query.ownedBy.trim()) {
      const ownerId = query.ownedBy.trim();
      dateMatch.$or = [
        { "assignedTo.userId": ownerId },
        { "metadata.createdByUserId": ownerId },
        { "metadata.involvedAssigneeIds": ownerId },
        { tags: `created_by_${ownerId}` },
        { tags: `involved_${ownerId}` },
      ];
    } else if (typeof query.assignedTo === "string" && query.assignedTo.trim()) {
      dateMatch["assignedTo.userId"] = query.assignedTo.trim();
    }
    if (typeof query.department === "string" && query.department.trim()) {
      dateMatch.department = query.department.trim();
    }

    const openStatuses = ["open", "assigned", "under_review", "awaiting_user_response", "in_progress", "escalated", "reopened", "waiting_for_customer", "waiting_for_internal_team"];
    const now = new Date();
    /** Tickets handed off at least once (CCE → staff/admin or reassigned between agents). */
    const reassignedMatch = {
      ...dateMatch,
      status: { $in: openStatuses },
      $or: [
        { "metadata.lastReassignedAt": { $exists: true, $nin: [null, ""] } },
        { "metadata.lastReassignedFrom": { $exists: true, $nin: [null, ""] } },
        { "metadata.involvedAssigneeIds.0": { $exists: true } },
      ],
    };

    const currentStatusMatch: Record<string, unknown> = {
      status: { $in: openStatuses },
    };
    if (dateMatch.$or) currentStatusMatch.$or = dateMatch.$or;
    else if (dateMatch["assignedTo.userId"]) {
      currentStatusMatch["assignedTo.userId"] = dateMatch["assignedTo.userId"];
    }
    if (dateMatch.department) currentStatusMatch.department = dateMatch.department;

    const [
      totals,
      byStatus,
      byPriority,
      byDepartment,
      assignmentLoad,
      overdue,
      unassigned,
      reassigned,
      sla,
      recent,
      openNow,
      overdueNow,
      unassignedNow,
      byStatusNow,
    ] = await Promise.all([
      Ticket.countDocuments(dateMatch),
      Ticket.aggregate([{ $match: dateMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: dateMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: dateMatch }, { $group: { _id: "$department", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([
        { $match: { ...dateMatch, status: { $in: openStatuses } } },
        { $group: { _id: "$assignedTo.userId", agent: { $first: "$assignedTo" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Ticket.countDocuments({ ...dateMatch, dueAt: { $lt: now }, status: { $in: openStatuses } }),
      Ticket.countDocuments({
        ...dateMatch,
        status: { $in: openStatuses },
        $or: [
          { assignedTo: { $exists: false } },
          { "assignedTo.userId": { $exists: false } },
          { "assignedTo.userId": null },
          { "assignedTo.userId": "" },
        ],
      }),
      Ticket.countDocuments(reassignedMatch),
      Ticket.aggregate([
        { $match: { ...dateMatch, firstResponseAt: { $exists: true } } },
        {
          $project: {
            responseMinutes: { $divide: [{ $subtract: ["$firstResponseAt", "$createdAt"] }, 60000] },
            resolutionMinutes: { $cond: [{ $ifNull: ["$resolvedAt", false] }, { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 60000] }, null] },
          },
        },
        {
          $group: {
            _id: null,
            avgFirstResponseMinutes: { $avg: "$responseMinutes" },
            avgResolutionMinutes: { $avg: "$resolutionMinutes" },
          },
        },
      ]),
      Ticket.find(dateMatch).sort({ updatedAt: -1, _id: -1 }).limit(10).select("title status priority department assignedTo dueAt updatedAt").lean(),
      Ticket.countDocuments(currentStatusMatch),
      Ticket.countDocuments({ ...currentStatusMatch, dueAt: { $lt: now } }),
      Ticket.countDocuments({
        ...currentStatusMatch,
        $or: [
          { assignedTo: { $exists: false } },
          { "assignedTo.userId": { $exists: false } },
          { "assignedTo.userId": null },
          { "assignedTo.userId": "" },
        ],
      }),
      Ticket.aggregate([
        { $match: currentStatusMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totals,
      open: byStatus.filter((item) => openStatuses.includes(item._id)).reduce((sum, item) => sum + item.count, 0),
      openNow,
      overdue,
      overdueNow,
      unassigned,
      unassignedNow,
      reassigned,
      byStatus,
      byStatusNow,
      byPriority,
      byDepartment,
      assignmentLoad,
      sla: sla[0] ?? { avgFirstResponseMinutes: 0, avgResolutionMinutes: 0 },
      recent,
    };
  }

  static async trends(query: Record<string, unknown>) {
    const days = Math.min(Math.max(Number(query.days) || 14, 1), 90);
    const from = parseDate(query.from) || (() => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const to = parseDate(query.to);

    const match: Record<string, unknown> = {
      createdAt: { $gte: from, ...(to ? { $lte: to } : {}) },
    };
    if (typeof query.ownedBy === "string" && query.ownedBy.trim()) {
      const ownerId = query.ownedBy.trim();
      match.$or = [
        { "assignedTo.userId": ownerId },
        { "metadata.createdByUserId": ownerId },
        { "metadata.involvedAssigneeIds": ownerId },
        { tags: `created_by_${ownerId}` },
        { tags: `involved_${ownerId}` },
      ];
    } else if (typeof query.assignedTo === "string" && query.assignedTo.trim()) {
      match["assignedTo.userId"] = query.assignedTo.trim();
    }
    if (typeof query.department === "string" && query.department.trim()) {
      match.department = query.department.trim();
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ];

    return Ticket.aggregate(pipeline);
  }

  static async agentPerformance(query: Record<string, unknown>) {
    const departmentMatch = typeof query.department === "string" ? { department: query.department } : {};

    return Ticket.aggregate([
      { $match: { ...departmentMatch, "assignedTo.userId": { $exists: true } } },
      {
        $group: {
          _id: "$assignedTo.userId",
          agent: { $first: "$assignedTo" },
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [{ $in: ["$status", ["open", "assigned", "under_review", "awaiting_user_response", "in_progress", "escalated", "reopened", "waiting_for_customer", "waiting_for_internal_team"]] }, 1, 0],
            },
          },
          resolved: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueAt", new Date()] },
                    { $not: [{ $in: ["$status", ["resolved", "closed"]] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { open: -1, overdue: -1 } },
    ]);
  }
}

