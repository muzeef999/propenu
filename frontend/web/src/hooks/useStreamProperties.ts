"use client";

import { useEffect, useState } from "react";
import { Property } from "@/types/property";

export function useStreamProperties(url: string) {
  const [items, setItems] = useState<Property[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    // 🔹 Reset state every time URL (filters / propertyType) changes
    setItems([]);
    setMeta(null);
    setLoading(true);

    let cancelled = false;

    async function start() {
      try {
        const res = await fetch(url);

        if (!res.body) {
          throw new Error("ReadableStream is not supported or body is null");
        }

        const reader = res.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let buffer = "";
        const nextItems: Property[] = []; // ⬅️ local array for THIS request

        while (true) {
          const { value, done } = await reader.read();
          if (done || cancelled) break;

          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // keep last partial chunk

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const obj = JSON.parse(trimmed);

            if (obj.__meta) {
              setMeta(obj.__meta);
              continue;
            }

            // ⬅️ collect in local array instead of appending to state
            nextItems.push(obj as Property);
          }
        }

        // ⬅️ set final list ONCE when stream ends
        if (!cancelled) {
          setItems(nextItems);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { items, meta, loading };
}
