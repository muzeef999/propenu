"use client";

import { useEffect } from "react";

type PublicViewEntityType = "project" | "property";
type PublicViewPropertyType =
  | "residential"
  | "commercial"
  | "land"
  | "agricultural";

type Props = {
  entityType: PublicViewEntityType;
  entityId: string;
  propertyType?: PublicViewPropertyType;
};

const VISITOR_ID_KEY = "propenu_public_visitor_id";
const LAST_VIEW_PREFIX = "propenu_public_view_last";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const visitorId = window.crypto.randomUUID();
  window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

export default function PublicViewTracker({
  entityType,
  entityId,
  propertyType,
}: Props) {
  useEffect(() => {
    if (!entityId || typeof window === "undefined") return;

    const storageKey = `${LAST_VIEW_PREFIX}:${entityType}:${entityId}`;
    const now = Date.now();
    const lastViewedAt = Number(window.localStorage.getItem(storageKey) || 0);

    if (Number.isFinite(lastViewedAt) && now - lastViewedAt < THIRTY_MINUTES_MS) {
      return;
    }

    const visitorId = getVisitorId();
    window.localStorage.setItem(storageKey, String(now));

    void fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/properties/interactions/public-view`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId,
          ...(propertyType ? { propertyType } : {}),
          visitorId,
          pageUrl: `${window.location.pathname}${window.location.search}`,
        }),
        keepalive: true,
      },
    ).catch(() => {
      // Avoid hammering the endpoint if the request fails immediately.
      window.localStorage.removeItem(storageKey);
    });
  }, [entityId, entityType, propertyType]);

  return null;
}
