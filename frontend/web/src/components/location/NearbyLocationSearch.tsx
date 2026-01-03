"use client";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { setBaseField } from "@/Redux/slice/postPropertySlice";
import {
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiX,
} from "react-icons/hi";
import { MdClose } from "react-icons/md";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const NearbyLocationSearch = ({
  city,
  state,
}: {
  city?: string;
  state?: string;
}) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nearbyPlaces =
    useSelector((s: any) => s.postProperty.base.nearbyPlaces) || [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  /* 🔍 Search */
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const searchPlaces = async () => {
      try {
        setLoading(true);
        const fullQuery = [query, city, state].filter(Boolean).join(", ");

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            fullQuery
          )}&limit=5`,
          { signal: controller.signal }
        );

        setResults(await res.json());
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
  }, [query, city, state]);

  /* ❌ Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ➕ Add place */
  const addPlace = (place: SearchResult) => {
    if (nearbyPlaces.some((p: any) => p.name === place.display_name)) return;

    dispatch(
      setBaseField({
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

  /* ❌ Remove place */
  const removePlace = (index: number) => {
    const updated = nearbyPlaces.filter((_: any, i: number) => i !== index);

    dispatch(
      setBaseField({
        key: "nearbyPlaces",
        value: updated,
      })
    );
  };

  return (
    <div className="space-y-4 w-full" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <HiOutlineLocationMarker className="text-green-600 text-lg" />
        Nearby Landmarks
      </label>

      {/* Search input */}
      <div className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {loading ? (
              <HiOutlineRefresh className="animate-spin text-gray-400" />
            ) : (
              <HiOutlineSearch className="text-gray-400 group-focus-within:text-green-500" />
            )}
          </div>

          <input
            className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition"
            placeholder="Search nearby place (e.g. Metro, Hospital)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
            >
              <MdClose size={18} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {results.map((place, index) => (
              <button
                key={index}
                onClick={() => addPlace(place)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              >
                <HiOutlineLocationMarker className="mt-0.5 text-gray-400 shrink-0" />
                <span className="text-gray-800 font-medium line-clamp-2">
                  {place.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 pt-1">
        {nearbyPlaces.map((p: any, i: number) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-medium pl-3 pr-1.5 py-1 rounded-full"
          >
            <span className="max-w-[200px] truncate">{p.name.split(",")[0]}</span>
            <button
              onClick={() => removePlace(i)}
              className="p-0.5 rounded-full hover:bg-red-100 text-green-700 hover:text-red-600"
            >
              <HiX size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyLocationSearch;
