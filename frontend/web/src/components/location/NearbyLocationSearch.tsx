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

const SEARCH_RADIUS_KM = 5;
const SEARCH_RESULT_LIMIT = 5;
const PHOTON_SEARCH_CANDIDATE_LIMIT = 15;

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

type PhotonSearchResponse = {
  features?: PhotonFeature[];
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

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (
  source: [number, number],
  destination: [number, number]
) => {
  const [sourceLng, sourceLat] = source;
  const [destinationLng, destinationLat] = destination;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destinationLat - sourceLat);
  const lngDelta = toRadians(destinationLng - sourceLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(sourceLat)) *
      Math.cos(toRadians(destinationLat)) *
      Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getBoundingBox = (
  [lng, lat]: [number, number],
  radiusKm: number
): [number, number, number, number] => {
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos(toRadians(lat));
  const lngDelta = radiusKm / (111 * Math.max(Math.abs(cosLat), 0.01));

  return [lng - lngDelta, lat - latDelta, lng + lngDelta, lat + latDelta];
};

const buildAddress = (properties?: PhotonFeature["properties"]) => {
  if (!properties) return undefined;

  const streetLine = [properties.street, properties.housenumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  const parts = [
    streetLine,
    properties.suburb,
    properties.district,
    properties.city,
    properties.county,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter(Boolean)
    .map((part) => String(part).trim());

  return parts.length > 0 ? parts.join(", ") : undefined;
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
      const searchPlaces = async () => {
        try {
          setLoading(true);
          setSearchMessage(null);

          const params = new URLSearchParams({
            q: query,
            lang: "en",
            limit: String(PHOTON_SEARCH_CANDIDATE_LIMIT),
          });

          if (coordinates?.length === 2) {
            const [lng, lat] = coordinates;
            const [minLng, minLat, maxLng, maxLat] = getBoundingBox(
              coordinates,
              SEARCH_RADIUS_KM
            );

            params.set("lon", String(lng));
            params.set("lat", String(lat));
            params.set("bbox", `${minLng},${minLat},${maxLng},${maxLat}`);
          }

          const res = await fetch(
            `https://photon.komoot.io/api/?${params.toString()}`,
            {
              signal: controller.signal,
              headers: {
                "Accept-Language": "en",
              },
            }
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

          const data = (await res.json()) as PhotonSearchResponse;
          const nextResults = (Array.isArray(data?.features) ? data.features : [])
            .map((feature) => {
              const placeCoordinates = feature.geometry?.coordinates;
              const [longitude, latitude] = Array.isArray(placeCoordinates)
                ? placeCoordinates
                : [];
              const normalizedCoordinates =
                Number.isFinite(longitude) && Number.isFinite(latitude)
                  ? ([longitude, latitude] as [number, number])
                  : undefined;
              const distanceKm =
                coordinates && normalizedCoordinates
                  ? getDistanceKm(coordinates, normalizedCoordinates)
                  : undefined;
              const address = buildAddress(feature.properties);
              const title =
                feature.properties?.name ||
                address ||
                `${query}${city ? `, ${city}` : ""}`;

              return {
                id: feature.properties?.osm_id
                  ? String(feature.properties.osm_id)
                  : normalizedCoordinates?.join(","),
                title,
                address: address && address !== title ? address : undefined,
                type:
                  feature.properties?.osm_value || feature.properties?.osm_key,
                coordinates: normalizedCoordinates,
                distanceKm,
              } satisfies SearchResult;
            })
            .filter((place) => Boolean(place.title))
            .filter((place) =>
              coordinates ? (place.distanceKm ?? Infinity) <= SEARCH_RADIUS_KM : true
            )
            .slice(0, SEARCH_RESULT_LIMIT);

          setResults(nextResults);
          if (nextResults.length === 0) {
            setSearchMessage(
              coordinates
                ? "No nearby places found within 10 km for this search."
                : "No matching places found for this search."
            );
          }
        } catch (err) {
          if ((err as { name?: string }).name !== "AbortError") {
            console.error("Photon nearby search error", err);
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
  }, [city, coordinates, locality, query, state]);

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
          : "Pin the property on the map to search nearby landmarks with Photon."}
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
