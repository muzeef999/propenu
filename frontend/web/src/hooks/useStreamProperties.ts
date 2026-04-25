"use client";

import { useEffect, useState } from "react";
import { Property } from "@/types/property";
import { SearchFilterParams } from "@/types/sharedTypes";
import { minDelay } from "@/utilies/minDelay";

export function useStreamProperties(params: SearchFilterParams) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [sponsored, setSponsored] = useState<Property[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const startedAt = Date.now();
      setLoading(true);
      setItems([]);
      setTotal(null);

      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/search?${query}`,
      );

      if (!res.body) {
        console.error("Streaming not supported");
        setLoading(false);
        return;
      }

      const sponsoredPromise = fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/sponsored?${query}`,
      ).then((res) => res.json());

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done || cancelled) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line) as any;

            if (parsed && parsed.__meta) {
              if (typeof parsed.__meta.total === "number") {
                setTotal(parsed.__meta.total);
              }
              continue;
            }

            // âœ… append one property at a time
            setItems((prev) => [...prev, parsed as Property]);
          } catch (err) {
            console.error("Invalid JSON chunk", line);
          }
        }
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < 1000) {
        await minDelay(1000 - elapsed);
      }

      const sponsoredRes = await sponsoredPromise;

      if (!cancelled) {
        setSponsored(sponsoredRes.data || []);
        setLoading(false);
      }
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return { items, sponsored, loading, total };
}
