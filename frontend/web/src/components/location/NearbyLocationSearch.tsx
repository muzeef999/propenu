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

const SEARCH_RADIUS_KM = 10;

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  distanceKm?: number;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (
  origin: [number, number],
  destination: [number, number]
) => {
  const [originLon, originLat] = origin;
  const [destinationLon, destinationLat] = destination;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destinationLat - originLat);
  const lonDelta = toRadians(destinationLon - originLon);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
    Math.cos(toRadians(destinationLat)) *
    Math.sin(lonDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getViewboxForRadius = (
  [longitude, latitude]: [number, number],
  radiusKm: number
) => {
  const latOffset = radiusKm / 111;
  const lonOffset =
    radiusKm / (111 * Math.max(Math.cos(toRadians(latitude)), 0.01));

  return {
    left: longitude - lonOffset,
    top: latitude + latOffset,
    right: longitude + lonOffset,
    bottom: latitude - latOffset,
  };
};

const formatDistance = (distanceKm?: number) => {
  if (distanceKm === undefined) return undefined;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

const NearbyLocationSearch = ({
  city,
  state,
  locality,
  coordinates,
}: {
  city?: string;
  state?: string;
  locality?: string;
  coordinates?: [number, number];
}) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nearbyPlaces =
    useSelector((s: any) => s.postProperty.base.nearbyPlaces) || [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  /* 🔍 Search */
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const controller = new AbortController();

      const searchPlaces = async () => {
        try {
          setLoading(true);

          const params = new URLSearchParams({
            format: "json",
            q: [query, locality, city, state].filter(Boolean).join(", "),
            limit: coordinates ? "20" : "5",
            "accept-language": "en",
            addressdetails: "1",
          });

          if (coordinates) {
            const { left, top, right, bottom } = getViewboxForRadius(
              coordinates,
              SEARCH_RADIUS_KM
            );

            params.set("viewbox", `${left},${top},${right},${bottom}`);
            params.set("bounded", "1");
          }

          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
              signal: controller.signal,
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (!res.ok) return;

          const data = (await res.json()) as SearchResult[];

          const nextResults = coordinates
            ? data
              .map((place) => ({
                ...place,
                distanceKm: getDistanceKm(coordinates, [
                  Number(place.lon),
                  Number(place.lat),
                ]),
              }))
              .filter((place) => place.distanceKm <= SEARCH_RADIUS_KM)
              .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
              .slice(0, 5)
            : data.slice(0, 5);

          setResults(nextResults);
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
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, locality, city, state, coordinates]);

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
            distanceText: formatDistance(place.distanceKm),
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
      <p className="text-xs text-gray-500">
        {coordinates
          ? `Search results are limited to places within ${SEARCH_RADIUS_KM} km of the pinned property location.`
          : "Pin the property on the map to limit nearby places within a 10 km radius."}
      </p>

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
                <span className="min-w-0 flex-1">
                  <span className="block text-gray-800 font-medium line-clamp-2">
                    {place.display_name}
                  </span>
                  {place.distanceKm !== undefined && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {formatDistance(place.distanceKm)} away
                    </span>
                  )}
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
            <span className="max-w-60 truncate">
              {p.name.split(",")[0]}
              {p.distanceText ? ` (${p.distanceText})` : ""}
            </span>
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
