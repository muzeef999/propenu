import type { PipelineStage } from "mongoose";
import { Ticket } from "../ticket";

const parseDate = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export class DashboardService {
  static async overview(query: Record<string, unknown>) {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const dateMatch: Record<string, unknown> = {};

    if (from || to) {
      dateMatch.createdAt = {};
      if (from) (dateMatch.createdAt as Record<string, Date>).$gte = from;
      if (to) (dateMatch.createdAt as Record<string, Date>).$lte = to;
    }

    const openStatuses = ["open", "in_progress", "waiting_for_customer", "waiting_for_internal_team", "reopened"];
    const now = new Date();

    const [
      totals,
      byStatus,
      byPriority,
      byDepartment,
      assignmentLoad,
      overdue,
      unassigned,
      sla,
      recent,
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
      Ticket.countDocuments({ ...dateMatch, assignedTo: { $exists: false }, status: { $in: openStatuses } }),
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
      Ticket.find(dateMatch).sort({ updatedAt: -1 }).limit(10).select("title status priority department assignedTo dueAt updatedAt").lean(),
    ]);

    return {
      totals,
      open: byStatus.filter((item) => openStatuses.includes(item._id)).reduce((sum, item) => sum + item.count, 0),
      overdue,
      unassigned,
      byStatus,
      byPriority,
      byDepartment,
      assignmentLoad,
      sla: sla[0] ?? { avgFirstResponseMinutes: 0, avgResolutionMinutes: 0 },
      recent,
    };
  }

  static async trends(query: Record<string, unknown>) {
    const days = Math.min(Math.max(Number(query.days) || 14, 1), 90);
    const from = new Date();
    from.setDate(from.getDate() - days);

    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: from } } },
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
              $cond: [{ $in: ["$status", ["open", "in_progress", "waiting_for_customer", "waiting_for_internal_team", "reopened"]] }, 1, 0],
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

