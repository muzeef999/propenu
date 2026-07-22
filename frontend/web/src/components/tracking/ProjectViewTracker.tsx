"use client";

import { useEffect } from "react";
import { trackInteraction } from "@/services/trackingService";

type Props = {
  projectId: string;
  title?: string;
  slug?: string;
  locality?: string;
  city?: string;
  state?: string;
  promotionType?: "normal" | "sponsored" | "featured" | "prime";
};

export default function ProjectViewTracker({ projectId, title, slug, locality, city, state, promotionType = "normal" }: Props) {
  useEffect(() => {
    if (!projectId) return;
    trackInteraction({
      eventType: "project_view",
      eventCategory: "project_engagement",
      entityType: "project",
      projectId,
      promotionType,
      source: "project_detail",
      placement: "project_page",
      metadata: { title, slug, locality, city, state, location: [locality, city, state].filter(Boolean).join(", ") },
    });
  }, [projectId, title, slug, locality, city, state, promotionType]);

  return null;
}
