export const REJECTION_REASONS = [
  "Unclear property photos",
  "Uploaded document does not match selected document type",
  "Document image not clearly visible",
  "Document expired or invalid",
  "Property details mismatch with document",
  "Duplicate listing already exists",
  "Suspicious or edited document detected",
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];
