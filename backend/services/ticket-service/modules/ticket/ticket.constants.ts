export const ticketStatuses = [
  "open",
  "in_progress",
  "waiting_for_customer",
  "waiting_for_internal_team",
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
