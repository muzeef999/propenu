import { closedTicketStatuses } from "./ticket.constants";
import { TicketRepository } from "./ticket.repository";
import {
  pickNextCustomerCareExecutiveDetailed,
  shouldAutoAssignCustomerCare,
  resolveAssignLocation,
  lookupRequesterLocation,
} from "./roundRobinAssign.service";
import { sendEmail } from "../../../../shared/email/email.service";
import {
  ticketAdditionalInformationReceivedSubject,
  ticketAdditionalInformationReceivedTemplate,
  ticketAttachmentIssueSubject,
  ticketAttachmentIssueTemplate,
  ticketAutoClosedSubject,
  ticketAutoClosedTemplate,
  ticketAwaitingExternalResponseSubject,
  ticketAwaitingExternalResponseTemplate,
  ticketAwaitingResponseReminderSubject,
  ticketAwaitingResponseReminderTemplate,
  ticketAwaitingUserResponseSubject,
  ticketAwaitingUserResponseTemplate,
  ticketEscalatedSubject,
  ticketEscalatedTemplate,
  ticketAssignedSubject,
  ticketAssignedTemplate,
  ticketCancelledSubject,
  ticketCancelledTemplate,
  ticketClosedSubject,
  ticketClosedTemplate,
  ticketDuplicateSubject,
  ticketDuplicateTemplate,
  ticketFeedbackRequestSubject,
  ticketFeedbackRequestTemplate,
  ticketInProgressSubject,
  ticketInProgressTemplate,
  ticketInvalidSubject,
  ticketInvalidTemplate,
  ticketRaisedSubject,
  ticketRaisedTemplate,
  ticketReopenedSubject,
  ticketReopenedTemplate,
  ticketResolutionConfirmationReminderSubject,
  ticketResolutionConfirmationReminderTemplate,
  ticketResolvedSubject,
  ticketResolvedTemplate,
  ticketResolutionDelayedSubject,
  ticketResolutionDelayedTemplate,
  ticketStatusUpdatedSubject,
  ticketStatusUpdatedTemplate,
  ticketSupportCallbackScheduledSubject,
  ticketSupportCallbackScheduledTemplate,
  ticketSupportResponseSubject,
  ticketSupportResponseTemplate,
  ticketUserReplyReceivedSubject,
  ticketUserReplyReceivedTemplate,
  ticketTransferredSubject,
  ticketTransferredTemplate,
  ticketUnderReviewSubject,
  ticketUnderReviewTemplate,
} from "../../../../shared/email/templates/ticketTemplates/email.templates";
import type {
  CreateTicketInput,
  CreateRequestCallInput,
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

const requesterActor = (input: { requester: CreateTicketInput["requester"] }): TicketActor => {
  const actor: TicketActor = { name: input.requester.name, role: "requester" };
  if (input.requester.userId) actor.userId = input.requester.userId;
  if (input.requester.email) actor.email = input.requester.email;
  return actor;
};

const toTitleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const resolveAssignedTeamName = (ticket: { assignedTo?: TicketActor; department?: string }) => {
  if (ticket.assignedTo?.name) return ticket.assignedTo.name;
  if (ticket.assignedTo?.role) return `${toTitleCase(ticket.assignedTo.role)} Team`;
  if (ticket.department) return `${toTitleCase(ticket.department)} Support Team`;
  return "Support Team";
};

const resolveDepartmentTeamName = (department?: string) => {
  if (!department) return "Support Team";
  return `${toTitleCase(department)} Support Team`;
};

const formatTimeRange = (start?: string, end?: string) => {
  if (start && end) return `${start} to ${end}`;
  return start || end || "";
};

const isSupportActor = (author?: TicketActor) =>
  !!author && author.role !== "requester" && author.role !== "customer";

const buildTicketTemplateBase = (
  ticket: {
    _id: unknown;
    requester: { name: string };
    title: string;
    category?: string;
    propertyId?: string;
    metadata?: Record<string, unknown>;
  },
) => {
  const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
  const base = {
    ticketId: String(ticket._id),
    requesterName: ticket.requester.name,
    subject: ticket.title,
  } as {
    ticketId: string;
    requesterName: string;
    subject: string;
    category?: string;
    propertyId?: string;
    propertyTitle?: string;
    projectId?: string;
    projectName?: string;
  };

  if (ticket.category) base.category = ticket.category;
  if (ticket.propertyId) base.propertyId = ticket.propertyId;
  if (typeof metadata.propertyTitle === "string") base.propertyTitle = metadata.propertyTitle;
  if (typeof metadata.relatedProjectId === "string") base.projectId = metadata.relatedProjectId;
  if (typeof metadata.relatedProjectName === "string") base.projectName = metadata.relatedProjectName;

  return base;
};

export class TicketService {
  static async createTicket(input: CreateTicketInput) {
    const requestedDepartment = input.department;
    const isRelationshipManagerTicket =
      input.metadata?.module === "relationship_manager" &&
      input.assignedTo?.role === "relationship_manager";

    const department = isRelationshipManagerTicket
      ? "relationship-manager"
      : "customer-care";

    let assignedTo = input.assignedTo;
    let autoAssigned = false;
    const activities = [activity("ticket.created", "Ticket created", requesterActor(input))];

    if (
      shouldAutoAssignCustomerCare({
        assignedTo,
        isRelationshipManagerTicket,
        department,
      })
    ) {
      try {
        let assignLocation =
          resolveAssignLocation({
            metadata: input.metadata,
            requester: input.requester as any,
          }) || null;
        if (!assignLocation) {
          assignLocation = await lookupRequesterLocation({
            userId: (input.requester as any)?.userId || (input.requester as any)?.id,
            email: input.requester?.email,
          });
        }

        const picked = await pickNextCustomerCareExecutiveDetailed(assignLocation);
        if (picked?.actor?.userId) {
          assignedTo = picked.actor;
          autoAssigned = true;
          const methodLabel =
            picked.method === "location_round_robin"
              ? "location round-robin"
              : "round-robin";
          activities.push(
            activity(
              "ticket.assigned",
              `Auto-assigned (${methodLabel}) to ${picked.actor.name || picked.actor.userId}`,
              {
                name: "System",
                role: "system",
              },
              undefined,
              picked.actor.name || picked.actor.userId,
            ),
          );
          // Stamp location + method onto metadata after create payload merge below
          (input as any).__autoAssignMethod = picked.method;
          (input as any).__assignLocation = assignLocation;
        }
      } catch (error) {
        console.warn("customer-care round-robin skipped:", error);
      }
    }

    const ticket = await TicketRepository.create({
      ...input,
      department,
      ...(assignedTo ? { assignedTo } : {}),
      ...(autoAssigned ? { status: "assigned" } : {}),
      priority: input.priority ?? "medium",
      source: input.source ?? "web",
      tags: cleanTags(input.tags),
      attachments: input.attachments ?? [],
      metadata: {
        ...(input.metadata ?? {}),
        requestedDepartment,
        intakeDepartment: department,
        ...((input as any).__assignLocation
          ? {
              assignState: (input as any).__assignLocation.state,
              assignCity: (input as any).__assignLocation.city,
              assignLocality: (input as any).__assignLocation.locality,
              state: (input.metadata as any)?.state || (input as any).__assignLocation.state,
              city: (input.metadata as any)?.city || (input as any).__assignLocation.city,
              locality:
                (input.metadata as any)?.locality || (input as any).__assignLocation.locality,
            }
          : {}),
        ...(autoAssigned
          ? {
              autoAssigned: true,
              autoAssignMethod: (input as any).__autoAssignMethod || "round_robin",
              autoAssignedAt: new Date().toISOString(),
            }
          : {}),
      },
      activities,
    });

    if (ticket.requester.email) {
      const templateParams: Parameters<typeof ticketRaisedTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        submittedOn: ticket.createdAt,
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketRaisedSubject(String(ticket._id)),
          html: ticketRaisedTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket email failed:", error);
      }
    }

    if (autoAssigned && ticket.requester.email && ticket.assignedTo) {
      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketAssignedSubject(String(ticket._id)),
          html: ticketAssignedTemplate({
            ...buildTicketTemplateBase(ticket),
            assignedTeam: resolveAssignedTeamName(ticket),
            currentStatus: toTitleCase(ticket.status),
          }),
        });
      } catch (error) {
        console.error("ticket auto-assignment email failed:", error);
      }
    }

    return ticket;
  }

  static async createRequestCall(input: CreateRequestCallInput) {
    const scheduledAt = new Date(input.date);
    let assignedTo: TicketActor | undefined;
    let autoAssigned = false;
    const activities = [
      activity(
        "ticket.request_call_created",
        `Call request created for ${input.timeSlot}`,
        requesterActor({ requester: input.requester }),
      ),
    ];

    if (input.relationshipManagerId || input.relationshipManagerName) {
      assignedTo = { role: "relationship_manager" };
      if (input.relationshipManagerId) assignedTo.userId = input.relationshipManagerId;
      if (input.relationshipManagerName) assignedTo.name = input.relationshipManagerName;
    } else {
      try {
        let assignLocation =
          resolveAssignLocation({
            metadata: {
              relatedProjectId: input.relatedProjectId,
            },
            requester: input.requester as any,
          }) || null;
        if (!assignLocation) {
          assignLocation = await lookupRequesterLocation({
            userId: (input.requester as any)?.userId || (input.requester as any)?.id,
            email: input.requester?.email,
          });
        }
        const picked = await pickNextCustomerCareExecutiveDetailed(assignLocation);
        if (picked?.actor?.userId) {
          assignedTo = picked.actor;
          autoAssigned = true;
          const methodLabel =
            picked.method === "location_round_robin"
              ? "location round-robin"
              : "round-robin";
          activities.push(
            activity(
              "ticket.assigned",
              `Auto-assigned (${methodLabel}) to ${picked.actor.name || picked.actor.userId}`,
              { name: "System", role: "system" },
              undefined,
              picked.actor.name || picked.actor.userId,
            ),
          );
          (input as any).__autoAssignMethod = picked.method;
          (input as any).__assignLocation = assignLocation;
        }
      } catch (error) {
        console.warn("request-call round-robin skipped:", error);
      }
    }

    return TicketRepository.create({
      title: `Request a Call - ${input.category}`,
      description: input.subject,
      requester: input.requester,
      category: "request_call",
      department: assignedTo?.role === "relationship_manager" ? "relationship-manager" : "customer-care",
      ...(assignedTo ? { assignedTo } : {}),
      ...(autoAssigned ? { status: "assigned" } : {}),
      priority: "medium",
      source: input.source ?? "web",
      tags: cleanTags(["request_call", input.category, input.timeSlot]),
      metadata: {
        module: "relationship_manager",
        requestType: "call_request",
        requestCategory: input.category,
        relatedProjectId: input.relatedProjectId,
        relatedProjectName: input.relatedProjectName,
        scheduledDate: input.date,
        timeSlot: input.timeSlot,
        subject: input.subject,
        notes: input.notes,
        relationshipManagerName: input.relationshipManagerName,
        relationshipManagerId: input.relationshipManagerId,
        intakeDepartment:
          assignedTo?.role === "relationship_manager" ? "relationship-manager" : "customer-care",
        ...((input as any).__assignLocation
          ? {
              assignState: (input as any).__assignLocation.state,
              assignCity: (input as any).__assignLocation.city,
              assignLocality: (input as any).__assignLocation.locality,
              state: (input as any).__assignLocation.state,
              city: (input as any).__assignLocation.city,
              locality: (input as any).__assignLocation.locality,
            }
          : {}),
        ...(autoAssigned
          ? {
              autoAssigned: true,
              autoAssignMethod: (input as any).__autoAssignMethod || "round_robin",
              autoAssignedAt: new Date().toISOString(),
            }
          : {}),
      },
      dueAt: scheduledAt,
      attachments: [],
      activities,
    });
  }

  static listTickets(query: TicketListQuery) {
    return TicketRepository.list(query);
  }

  static getTicket(id: string) {
    return TicketRepository.findById(id);
  }

  static async updateTicket(id: string, input: UpdateTicketInput, actor?: TicketActor) {
    const existing = await TicketRepository.findById(id);
    if (!existing) return null;

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

    const ticket = await TicketRepository.updateById(id, update);
    if (!ticket) return null;

    const nextMetadata = (ticket.metadata ?? {}) as Record<string, unknown>;
    const previousMetadata = (existing.metadata ?? {}) as Record<string, unknown>;

    if (
      ticket.requester.email &&
      typeof input.department === "string" &&
      input.department !== existing.department
    ) {
      const templateParams: Parameters<typeof ticketTransferredTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        transferredFrom: resolveDepartmentTeamName(existing.department),
        transferredTo: resolveDepartmentTeamName(input.department),
        currentStatus: "Transferred",
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketTransferredSubject(String(ticket._id)),
          html: ticketTransferredTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket transferred email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      typeof nextMetadata.awaitingResponseFrom === "string" &&
      nextMetadata.awaitingResponseFrom.length > 0 &&
      nextMetadata.awaitingResponseFrom !== previousMetadata.awaitingResponseFrom
    ) {
      const templateParams: Parameters<typeof ticketAwaitingExternalResponseTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        awaitingResponseFrom: nextMetadata.awaitingResponseFrom,
        currentStatus: "Awaiting External Response",
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketAwaitingExternalResponseSubject(String(ticket._id)),
          html: ticketAwaitingExternalResponseTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket awaiting external response email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      typeof nextMetadata.invalidReason === "string" &&
      nextMetadata.invalidReason.length > 0 &&
      nextMetadata.invalidReason !== previousMetadata.invalidReason
    ) {
      const templateParams: Parameters<typeof ticketInvalidTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        currentStatus: "Invalid",
        reason: nextMetadata.invalidReason,
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketInvalidSubject(String(ticket._id)),
          html: ticketInvalidTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket invalid email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      typeof nextMetadata.attachmentIssue === "string" &&
      nextMetadata.attachmentIssue.length > 0 &&
      nextMetadata.attachmentIssue !== previousMetadata.attachmentIssue &&
      typeof nextMetadata.attachmentName === "string"
    ) {
      const templateParams: Parameters<typeof ticketAttachmentIssueTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        attachmentName: nextMetadata.attachmentName,
        issueIdentified: nextMetadata.attachmentIssue,
      };

      if (ticket.dueAt) {
        templateParams.dueDate = new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(ticket.dueAt);
      }

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketAttachmentIssueSubject(String(ticket._id)),
          html: ticketAttachmentIssueTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket attachment issue email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      typeof nextMetadata.duplicateOfTicketId === "string" &&
      nextMetadata.duplicateOfTicketId.length > 0 &&
      nextMetadata.duplicateOfTicketId !== previousMetadata.duplicateOfTicketId
    ) {
      const templateParams: Parameters<typeof ticketDuplicateTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        duplicateTicketId: String(ticket._id),
        existingTicketId: nextMetadata.duplicateOfTicketId,
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketDuplicateSubject(String(ticket._id)),
          html: ticketDuplicateTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket duplicate email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      (
        nextMetadata.callbackDate !== previousMetadata.callbackDate ||
        nextMetadata.callbackStartTime !== previousMetadata.callbackStartTime ||
        nextMetadata.callbackEndTime !== previousMetadata.callbackEndTime ||
        nextMetadata.callbackContactNumber !== previousMetadata.callbackContactNumber
      ) &&
      typeof nextMetadata.callbackDate === "string" &&
      typeof nextMetadata.callbackContactNumber === "string"
    ) {
      const callbackDate = new Date(nextMetadata.callbackDate);
      const templateParams: Parameters<typeof ticketSupportCallbackScheduledTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        callbackDate: Number.isNaN(callbackDate.getTime())
          ? nextMetadata.callbackDate
          : new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(callbackDate),
        callbackTime: formatTimeRange(
          typeof nextMetadata.callbackStartTime === "string" ? nextMetadata.callbackStartTime : undefined,
          typeof nextMetadata.callbackEndTime === "string" ? nextMetadata.callbackEndTime : undefined,
        ),
        contactNumber: nextMetadata.callbackContactNumber,
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketSupportCallbackScheduledSubject(String(ticket._id)),
          html: ticketSupportCallbackScheduledTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket callback scheduled email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      (
        nextMetadata.resolutionConfirmationReminder === true &&
        previousMetadata.resolutionConfirmationReminder !== true
      )
    ) {
      const templateParams: Parameters<typeof ticketResolutionConfirmationReminderTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
      };

      if (ticket.dueAt) {
        templateParams.confirmationDueDate = new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(ticket.dueAt);
      }

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketResolutionConfirmationReminderSubject(String(ticket._id)),
          html: ticketResolutionConfirmationReminderTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket resolution confirmation reminder email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      typeof nextMetadata.resolutionDelayReason === "string" &&
      nextMetadata.resolutionDelayReason.length > 0 &&
      (
        nextMetadata.resolutionDelayReason !== previousMetadata.resolutionDelayReason ||
        input.dueAt !== undefined
      )
    ) {
      const templateParams: Parameters<typeof ticketResolutionDelayedTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        currentStatus: toTitleCase(ticket.status),
        delayReason: nextMetadata.resolutionDelayReason,
      };

      if (ticket.dueAt) {
        templateParams.revisedResolutionTime = new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(ticket.dueAt);
      }

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketResolutionDelayedSubject(String(ticket._id)),
          html: ticketResolutionDelayedTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket resolution delayed email failed:", error);
      }
    }

    if (
      ticket.requester.email &&
      nextMetadata.feedbackRequested === true &&
      previousMetadata.feedbackRequested !== true
    ) {
      const templateParams: Parameters<typeof ticketFeedbackRequestTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketFeedbackRequestSubject(String(ticket._id)),
          html: ticketFeedbackRequestTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket feedback request email failed:", error);
      }
    }

    return ticket;
  }

  static deleteTicket(id: string) {
    return TicketRepository.findById(id).then(async (existing) => {
      if (!existing) return null;

      const deleted = await TicketRepository.deleteById(id);
      if (!deleted) return null;

      if (existing.requester.email) {
        const templateParams: Parameters<typeof ticketCancelledTemplate>[0] = {
          ...buildTicketTemplateBase(existing),
          cancelledOn: new Date(),
          currentStatus: "Cancelled",
        };

        try {
          await sendEmail({
            to: existing.requester.email,
            subject: ticketCancelledSubject(String(existing._id)),
            html: ticketCancelledTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket cancelled email failed:", error);
        }
      }

      return deleted;
    });
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

    const ticket = await TicketRepository.updateById(id, update);
    if (!ticket) return null;

    if (ticket.requester.email) {
      let handledBySpecificTemplate = false;

      if (status === "under_review") {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketUnderReviewTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          currentStatus: toTitleCase(ticket.status),
        };

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketUnderReviewSubject(String(ticket._id)),
            html: ticketUnderReviewTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket under review email failed:", error);
        }
      }

      if (status === "in_progress") {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketInProgressTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          currentStatus: toTitleCase(ticket.status),
        };

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketInProgressSubject(String(ticket._id)),
            html: ticketInProgressTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket in progress email failed:", error);
        }
      }

      if (status === "awaiting_user_response" && reason) {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketAwaitingUserResponseTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          requestedInformation: reason,
        };

        if (ticket.dueAt) {
          templateParams.dueDate = new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(ticket.dueAt);
        }

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketAwaitingUserResponseSubject(String(ticket._id)),
            html: ticketAwaitingUserResponseTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket awaiting user response email failed:", error);
        }
      }

      if (status === "awaiting_user_response" && !reason) {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketAwaitingResponseReminderTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          currentStatus: toTitleCase(ticket.status),
        };

        if (ticket.dueAt) {
          templateParams.dueDate = new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(ticket.dueAt);
        }

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketAwaitingResponseReminderSubject(String(ticket._id)),
            html: ticketAwaitingResponseReminderTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket awaiting response reminder email failed:", error);
        }
      }

      if (status === "escalated") {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketEscalatedTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          escalatedTo: resolveAssignedTeamName(ticket),
          currentStatus: toTitleCase(ticket.status),
        };

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketEscalatedSubject(String(ticket._id)),
            html: ticketEscalatedTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket escalated email failed:", error);
        }
      }

      if (status === "resolved") {
        handledBySpecificTemplate = true;
        const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
        const templateParams: Parameters<typeof ticketResolvedTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          resolvedOn: ticket.resolvedAt ?? now,
        };

        if (typeof metadata.resolutionSummary === "string") {
          templateParams.resolutionSummary = metadata.resolutionSummary;
        } else if (reason) {
          templateParams.resolutionSummary = reason;
        }

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketResolvedSubject(String(ticket._id)),
            html: ticketResolvedTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket resolved email failed:", error);
        }
      }

      if (status === "reopened") {
        handledBySpecificTemplate = true;
        const templateParams: Parameters<typeof ticketReopenedTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          reopenedOn: now,
          currentStatus: toTitleCase(ticket.status),
        };

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketReopenedSubject(String(ticket._id)),
            html: ticketReopenedTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket reopened email failed:", error);
        }
      }

      if (status === "closed") {
        handledBySpecificTemplate = true;
        const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
        const autoClosed = metadata.autoClosed === true;

        if (autoClosed) {
          const templateParams: Parameters<typeof ticketAutoClosedTemplate>[0] = {
            ...buildTicketTemplateBase(ticket),
            closedOn: ticket.closedAt ?? now,
          };

          if (typeof metadata.autoCloseReason === "string") {
            templateParams.reason = metadata.autoCloseReason;
          } else if (reason) {
            templateParams.reason = reason;
          }

          try {
            await sendEmail({
              to: ticket.requester.email,
              subject: ticketAutoClosedSubject(String(ticket._id)),
              html: ticketAutoClosedTemplate(templateParams),
            });
          } catch (error) {
            console.error("ticket auto closed email failed:", error);
          }
        } else {
          const templateParams: Parameters<typeof ticketClosedTemplate>[0] = {
            ...buildTicketTemplateBase(ticket),
            closedOn: ticket.closedAt ?? now,
          };

          if (typeof metadata.resolutionSummary === "string") {
            templateParams.resolutionSummary = metadata.resolutionSummary;
          } else if (reason) {
            templateParams.resolutionSummary = reason;
          }

          try {
            await sendEmail({
              to: ticket.requester.email,
              subject: ticketClosedSubject(String(ticket._id)),
              html: ticketClosedTemplate(templateParams),
            });
          } catch (error) {
            console.error("ticket closed email failed:", error);
          }
        }
      }

      if (!handledBySpecificTemplate) {
        const templateParams: Parameters<typeof ticketStatusUpdatedTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          previousStatus: toTitleCase(existing.status),
          newStatus: toTitleCase(ticket.status),
          updatedOn: now,
        };

        if (reason) templateParams.updateMessage = reason;

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketStatusUpdatedSubject(String(ticket._id)),
            html: ticketStatusUpdatedTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket status updated email failed:", error);
        }
      }
    }

    return ticket;
  }

  static async assignTicket(id: string, assignedTo: TicketActor, actor?: TicketActor) {
    const existing = await TicketRepository.findById(id);
    if (!existing) return null;

    const ticket = await TicketRepository.updateById(id, {
      assignedTo,
      ...(existing.status === "open" ? { status: "assigned" } : {}),
      $push: {
        activities: activity(
          "ticket.assigned",
          `Ticket assigned to ${assignedTo.name || assignedTo.userId || "agent"}`,
          actor,
        ),
      },
    });

    if (!ticket) return null;

    if (ticket.requester.email) {
      const templateParams: Parameters<typeof ticketAssignedTemplate>[0] = {
        ...buildTicketTemplateBase(ticket),
        assignedTeam: resolveAssignedTeamName(ticket),
        currentStatus: toTitleCase(ticket.status),
      };

      try {
        await sendEmail({
          to: ticket.requester.email,
          subject: ticketAssignedSubject(String(ticket._id)),
          html: ticketAssignedTemplate(templateParams),
        });
      } catch (error) {
        console.error("ticket assignment email failed:", error);
      }
    }

    return ticket;
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
    const isCustomerReply = author?.role === "requester" || author?.role === "customer";
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

    if (isCustomerReply) {
      update.lastCustomerReplyAt = now;
      update.status = "under_review";
    } else {
      update.lastAgentReplyAt = now;
      update.firstResponseAt = now;
    }

    return TicketRepository.updateById(id, update).then(async (ticket) => {
      if (
        ticket &&
        visibility === "public" &&
        message.trim().length > 0 &&
        isSupportActor(author) &&
        ticket.requester.email
      ) {
        const templateParams: Parameters<typeof ticketSupportResponseTemplate>[0] = {
          ...buildTicketTemplateBase(ticket),
          supportResponse: message,
        };

        try {
          await sendEmail({
            to: ticket.requester.email,
            subject: ticketSupportResponseSubject(String(ticket._id)),
            html: ticketSupportResponseTemplate(templateParams),
          });
        } catch (error) {
          console.error("ticket support response email failed:", error);
        }
      }

      if (
        ticket &&
        visibility === "public" &&
        isCustomerReply &&
        ticket.requester.email
      ) {
        const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
        const awaitingAttachment = typeof metadata.attachmentIssue === "string" && metadata.attachmentIssue.length > 0;

        if (awaitingAttachment) {
          const templateParams: Parameters<typeof ticketAdditionalInformationReceivedTemplate>[0] = {
            ...buildTicketTemplateBase(ticket),
            receivedOn: now,
            currentStatus: toTitleCase(ticket.status),
          };

          try {
            await sendEmail({
              to: ticket.requester.email,
              subject: ticketAdditionalInformationReceivedSubject(String(ticket._id)),
              html: ticketAdditionalInformationReceivedTemplate(templateParams),
            });
          } catch (error) {
            console.error("ticket additional information received email failed:", error);
          }
        } else {
          const templateParams: Parameters<typeof ticketUserReplyReceivedTemplate>[0] = {
            ...buildTicketTemplateBase(ticket),
            replyReceivedOn: now,
            currentStatus: toTitleCase(ticket.status),
          };

          try {
            await sendEmail({
              to: ticket.requester.email,
              subject: ticketUserReplyReceivedSubject(String(ticket._id)),
              html: ticketUserReplyReceivedTemplate(templateParams),
            });
          } catch (error) {
            console.error("ticket user reply received email failed:", error);
          }
        }
      }

      return ticket;
    });
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
