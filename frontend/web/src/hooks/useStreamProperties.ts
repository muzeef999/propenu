"use client";

import { useEffect, useState } from "react";
import { Property } from "@/types/property";
import { SearchFilterParams } from "@/types/sharedTypes";

export function useStreamProperties(params: SearchFilterParams) {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setLoading(true);
      setItems([]);

      // 🔥 build query string from params
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/search?${query}`
      );

      if (!res.body) {
        console.error("Streaming not supported");
        setLoading(false);
        return;
      }

      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

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
            const property = JSON.parse(line) as Property;

            // ✅ append one property at a time
            setItems(prev => [...prev, property]);
          } catch (err) {
            console.error("Invalid JSON chunk", line);
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return { items, loading };
}
