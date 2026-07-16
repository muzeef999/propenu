export const ticketStatuses = [
  "open",
  "assigned",
  "under_review",
  "awaiting_user_response",
  "in_progress",
  "escalated",
  "resolved",
  "closed",
  "reopened",
] as const;

export const ticketPriorities = ["low", "medium", "high", "urgent"] as const;

export const ticketSources = [
  "web",
  "admin",
  "email",
  "phone",
  "whatsapp",
  "system",
] as const;

export const ticketVisibility = ["public", "internal"] as const;

export const closedTicketStatuses = new Set(["resolved", "closed"]);
