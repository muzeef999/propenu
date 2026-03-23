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
const MAPPLS_SEARCH_RESULT_LIMIT = 5;
 
type MapplsSuggestedLocation = {
  eLoc?: string;
  placeName?: string;
  placeAddress?: string;
  type?: string;
  distance?: number | string;
  latitude?: number | string;
  longitude?: number | string;
};
 
type MapplsSearchResponse = {
  suggestedLocations?: MapplsSuggestedLocation[];
};
 
type SearchResult = {
  id?: string;
  title: string;
  address?: string;
  type?: string;
  coordinates?: [number, number];
  distanceKm?: number;
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
 
  const nearbyPlaces =
    useSelector((s: any) => s.postProperty.base.nearbyPlaces) || [];
 
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
 
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
 
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setSearchMessage(null);
      return;
    }
 
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
 
    const controller = new AbortController();
 
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
      });
 
      const searchPlaces = async () => {
        try {
          setLoading(true);
          setSearchMessage(null);
 
          if (!apiBaseUrl) {
            setResults([]);
            setSearchMessage("API base URL is missing.");
            return;
          }
 
          if (coordinates) {
            params.set("lat", String(coordinates[1]));
            params.set("lng", String(coordinates[0]));
            params.set("radius", String(SEARCH_RADIUS_KM * 1000));
          }
 
          const res = await fetch(
            `${apiBaseUrl}/api/mappls/search?${params.toString()}`,
            { signal: controller.signal }
          );
 
          if (!res.ok) {
            let message = "Unable to fetch nearby places right now.";
 
            try {
              const errorData = await res.json();
              const details =
                errorData?.error ||
                errorData?.message ||
                errorData?.error_message ||
                (typeof errorData === "string" ? errorData : "");
 
              if (details) {
                message = String(details);
              }
            } catch {
              // Keep the fallback message when the error body is not JSON.
            }
 
            setResults([]);
            setSearchMessage(message);
            return;
          }
 
          const data = (await res.json()) as MapplsSearchResponse;
          const nextResults = (Array.isArray(data?.suggestedLocations)
            ? data.suggestedLocations
            : []
          )
            .map((place) => {
              const latitude = Number(place.latitude);
              const longitude = Number(place.longitude);
              const distanceMeters = Number(place.distance);
 
              return {
                id: place.eLoc,
                title: place.placeName || place.placeAddress || query,
                address: place.placeAddress,
                type: place.type,
                coordinates:
                  Number.isFinite(latitude) && Number.isFinite(longitude)
                    ? [longitude, latitude]
                    : undefined,
                distanceKm: Number.isFinite(distanceMeters)
                  ? distanceMeters / 1000
                  : undefined,
              } satisfies SearchResult;
            })
            .filter((place) => Boolean(place.title))
            .slice(0, MAPPLS_SEARCH_RESULT_LIMIT);
 
          setResults(nextResults);
          if (nextResults.length === 0) {
            setSearchMessage("No nearby places found for this search.");
          }
        } catch (err) {
          if ((err as { name?: string }).name !== "AbortError") {
            console.error("Mappls nearby search error", err);
            setResults([]);
            setSearchMessage("Unable to fetch nearby places right now.");
          }
        } finally {
          setLoading(false);
        }
      };
 
      void searchPlaces();
    }, 400);
 
    return () => {
      controller.abort();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [apiBaseUrl, city, coordinates, locality, query, state]);
 
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setResults([]);
        setSearchMessage(null);
      }
    };
 
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const addPlace = (place: SearchResult) => {
    const placeName = place.address
      ? `${place.title}, ${place.address}`
      : place.title;
 
    if (nearbyPlaces.some((p: any) => p.name === placeName)) return;
 
    dispatch(
      setBaseField({
        key: "nearbyPlaces",
        value: [
          ...nearbyPlaces,
          {
            name: placeName,
            type: place.type,
            coordinates: place.coordinates,
            distanceText: formatDistance(place.distanceKm),
            order: nearbyPlaces.length,
          },
        ],
      })
    );
 
    setQuery("");
    setResults([]);
    setSearchMessage(null);
  };
 
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
          : "Pin the property on the map to search nearby landmarks with Mappls."}
      </p>
 
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
            onChange={(event) => setQuery(event.target.value)}
          />
 
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setSearchMessage(null);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800"
            >
              <MdClose size={18} />
            </button>
          )}
        </div>
 
        {(results.length > 0 || searchMessage) && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {results.map((place, index) => (
              <button
                key={`${place.id || place.title}-${index}`}
                onClick={() => addPlace(place)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              >
                <HiOutlineLocationMarker className="mt-0.5 text-gray-400 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-gray-800 font-medium line-clamp-2">
                    {place.title}
                  </span>
                  {place.address && (
                    <span className="block text-xs text-gray-500 mt-1 line-clamp-2">
                      {place.address}
                    </span>
                  )}
                  {place.distanceKm !== undefined && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {formatDistance(place.distanceKm)} away
                    </span>
                  )}
                </span>
              </button>
            ))}
 
            {searchMessage && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                {searchMessage}
              </div>
            )}
          </div>
        )}
      </div>
 
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