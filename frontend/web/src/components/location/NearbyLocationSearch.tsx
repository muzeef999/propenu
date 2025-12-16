"use client";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { setLocationField } from "@/Redux/slice/postPropertySlice";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const NearbyLocationSearch = () => {
  const dispatch = useDispatch();

  const nearbyPlaces =
    useSelector((state: any) => state.postProperty.location.nearbyPlaces) || [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Search using Nominatim
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const searchPlaces = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "en",
            },
          }
        );

        const data = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Nearby search error", err);
        }
      } finally {
        setLoading(false);
      }
    };

    searchPlaces();

    return () => controller.abort();
  }, [query]);

  // ➕ Add nearby place
  const addPlace = (place: SearchResult) => {
    dispatch(
      setLocationField({
        key: "nearbyPlaces",
        value: [
          ...nearbyPlaces,
          {
            name: place.display_name,
            coordinates: [Number(place.lon), Number(place.lat)],
            order: nearbyPlaces.length,
          },
        ],
      })
    );

    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        Nearby places (search)
      </p>

      <input
        className="w-full border px-3 py-2 text-sm rounded"
        placeholder="Search nearby place (e.g. Metro station)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <p className="text-xs text-gray-400">Searching…</p>
      )}

      {results.length > 0 && (
        <ul className="border rounded bg-white max-h-48 overflow-auto">
          {results.map((place, index) => (
            <li
              key={index}
              onClick={() => addPlace(place)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* Selected nearby places */}
      {nearbyPlaces.length > 0 && (
        <ul className="text-sm text-gray-700 space-y-1">
          {nearbyPlaces.map((p: any, i: number) => (
            <li key={i}>• {p.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NearbyLocationSearch;
