// components/PopularCities.tsx
"use client";
import { useCity } from "@/hooks/useCity";

export default function PopularCities() {
  const { popular, normal, setCity } = useCity();

  return (
    <div className="flex gap-4 items-center">
      <div>
        <div className="text-xs text-gray-500">Popular</div>
        <div className="flex gap-2 mt-1">
          {popular.map((c) => (
            <button
              key={c.id}
              onClick={() => setCity(c)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-primary/10 text-sm"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-500">Other Cities</div>
        <div className="flex gap-2 mt-1">
          {normal.map((c) => (
            <button
              key={c.id}
              onClick={() => setCity(c)}
              className="px-3 py-1 rounded border text-sm"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
