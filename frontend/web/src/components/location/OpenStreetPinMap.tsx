"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type OpenStreetPinMapProps = {
  coordinates?: [number, number]; // [lng, lat]
  shouldAutoFocus?: boolean;
  onPinChange?: (payload: PinLocationPayload) => void;
};

type MapplsPosition = { lat: number; lng: number };

type PinLocationPayload = {
  coordinates: [number, number];
  locality?: string;
  city?: string;
  state?: string;
};

type MapplsMapOptions = {
  center: MapplsPosition | [number, number];
  zoom: number;
  zoomControl?: boolean;
  location?: boolean;
};

type MapplsMapInstance = {
  remove?: () => void;
  setCenter?: (center: MapplsPosition | [number, number]) => void;
  setZoom?: (zoom: number) => void;
  panTo?: (position: MapplsPosition) => void;
  flyTo?: (options: { center: [number, number]; zoom?: number }) => void;
  on?: (event: string, cb: (event: unknown) => void) => void;
  addListener?: (event: string, cb: (event: unknown) => void) => void;
};

type MapplsMarkerInstance = {
  remove?: () => void;
  setMap?: (map: unknown) => void;
};

type MapplsGlobal = {
  Map: new (element: string, options: MapplsMapOptions) => MapplsMapInstance;
  Marker: new (options: {
    map: unknown;
    position: MapplsPosition;
    fitbounds?: boolean;
  }) => MapplsMarkerInstance;
};

type ReverseGeocodeResult = {
  address?: {
    suburb?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
  };
};

const MAPPLS_SCRIPT_ID = "mappls-sdk-script";
const DEFAULT_POSITION: MapplsPosition = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
const AUTO_FOCUS_ZOOM = 13;

function formatToTitleCase(str: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
    {
      signal,
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data = (await res.json()) as ReverseGeocodeResult;
  const address = data.address;

  return {
    locality: formatToTitleCase(
      address?.suburb ||
        address?.neighbourhood ||
        address?.hamlet ||
        address?.village ||
        address?.town ||
        address?.city_district ||
        address?.county ||
        ""
    ),
    city: formatToTitleCase(
      address?.city ||
        address?.town ||
        address?.village ||
        address?.city_district ||
        address?.state_district ||
        address?.county ||
        ""
    ),
    state: formatToTitleCase(address?.state || ""),
  };
}

function getMapplsGlobal() {
  const win = window as unknown as {
    mappls?: MapplsGlobal;
    Mappls?: MapplsGlobal;
    __mapplsSdkPromise?: Promise<MapplsGlobal>;
  };
  return win.mappls ?? win.Mappls;
}

function loadMapplsSdk(apiKey: string): Promise<MapplsGlobal> {
  const existing = getMapplsGlobal();
  if (existing) return Promise.resolve(existing);

  const win = window as unknown as {
    mappls?: MapplsGlobal;
    Mappls?: MapplsGlobal;
    __mapplsSdkPromise?: Promise<MapplsGlobal>;
  };

  if (win.__mapplsSdkPromise) return win.__mapplsSdkPromise;

  win.__mapplsSdkPromise = new Promise<MapplsGlobal>((resolve, reject) => {
    const handleReady = () => {
      const sdk = getMapplsGlobal();
      if (sdk) resolve(sdk);
      else reject(new Error("Mappls SDK loaded but global object was not found."));
    };

    const existingScript = document.getElementById(
      MAPPLS_SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existingScript) {
      if (getMapplsGlobal()) {
        handleReady();
        return;
      }
      existingScript.addEventListener("load", handleReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load existing Mappls SDK script.")),
        {
          once: true,
        }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MAPPLS_SCRIPT_ID;
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = handleReady;
    script.onerror = () => reject(new Error("Failed to load Mappls SDK script."));
    document.body.appendChild(script);
  });

  win.__mapplsSdkPromise = win.__mapplsSdkPromise.catch((error) => {
    win.__mapplsSdkPromise = undefined;
    throw error;
  });

  return win.__mapplsSdkPromise;
}

function removeMarker(marker: MapplsMarkerInstance | null) {
  if (!marker) return;
  try {
    if (typeof marker.remove === "function") {
      marker.remove();
      return;
    }
    if (typeof marker.setMap === "function") {
      marker.setMap(null);
    }
  } catch (error) {
    console.warn("Marker cleanup warning:", error);
  }
}

function recenterMap(
  map: MapplsMapInstance,
  lat: number,
  lng: number,
  zoom: number
) {
  map.setCenter?.({ lat, lng });
  map.setZoom?.(zoom);
  map.panTo?.({ lat, lng });
}

const OpenStreetPinMap = ({
  coordinates,
  shouldAutoFocus = false,
  onPinChange,
}: OpenStreetPinMapProps) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const containerId = useId().replace(/:/g, "-");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapplsMapInstance | null>(null);
  const markerRef = useRef<MapplsMarkerInstance | null>(null);
  const sdkRef = useRef<MapplsGlobal | null>(null);
  const clickListenerAttachedRef = useRef(false);
  const mapRemovedRef = useRef(false);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);
  const onPinChangeRef = useRef(onPinChange);

  const apiKey =
    process.env.NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY ||
    process.env.NEXT_MAPPLS_MAP_SDK_KEY;

  const point = useMemo(() => {
    if (!coordinates || coordinates.length !== 2) return null;
    return { lat: coordinates[1], lng: coordinates[0] };
  }, [coordinates?.[0], coordinates?.[1]]);

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      if (!apiKey) {
        setMapError(
          "Mappls API key is missing. Set NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY in .env."
        );
        return;
      }
      if (!mapContainerRef.current) return;

      try {
        const sdk = await loadMapplsSdk(apiKey);
        if (cancelled) return;

        sdkRef.current = sdk;

        if (!mapRef.current) {
          mapRef.current = new sdk.Map(containerId, {
            center: DEFAULT_POSITION,
            zoom: 15,
            zoomControl: true,
            location: false,
          });
          mapRemovedRef.current = false;
          setMapReady(true);
        } else {
          setMapReady(true);
        }

        if (mapRef.current && !clickListenerAttachedRef.current) {
          const onMapClick = (event: unknown) => {
            const eventAny = event as {
              latlng?: { lat?: number; lng?: number };
              lngLat?: { lat?: number; lng?: number };
              lat?: number;
              lng?: number;
            };

            const lat = Number(
              eventAny?.latlng?.lat ?? eventAny?.lngLat?.lat ?? eventAny?.lat
            );
            const lng = Number(
              eventAny?.latlng?.lng ?? eventAny?.lngLat?.lng ?? eventAny?.lng
            );
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            removeMarker(markerRef.current);
            markerRef.current = new sdk.Marker({
              map: mapRef.current,
              position: { lat, lng },
              fitbounds: false,
            });

            if (mapRef.current) {
              recenterMap(mapRef.current, lat, lng, 15);
            }

            onPinChangeRef.current?.({
              coordinates: [lng, lat],
            });

            reverseGeocodeAbortRef.current?.abort();
            const controller = new AbortController();
            reverseGeocodeAbortRef.current = controller;

            reverseGeocode(lat, lng, controller.signal)
              .then((resolved) => {
                onPinChangeRef.current?.({
                  coordinates: [lng, lat],
                  ...resolved,
                });
              })
              .catch((error) => {
                if ((error as { name?: string })?.name === "AbortError") return;
                console.error("Map reverse geocoding error", error);
                onPinChangeRef.current?.({
                  coordinates: [lng, lat],
                });
              });
          };

          mapRef.current.on?.("click", onMapClick);
          mapRef.current.addListener?.("click", onMapClick);
          clickListenerAttachedRef.current = true;
        }

        setMapError(null);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load Mappls map right now.";
        setMapError(message);
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, containerId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !sdkRef.current || !point) return;

    removeMarker(markerRef.current);

    markerRef.current = new sdkRef.current.Marker({
      map: mapRef.current,
      position: point,
      fitbounds: false,
    });

    recenterMap(mapRef.current, point.lat, point.lng, AUTO_FOCUS_ZOOM);
  }, [mapReady, point?.lat, point?.lng, shouldAutoFocus]);

  useEffect(() => {
    return () => {
      reverseGeocodeAbortRef.current?.abort();
      removeMarker(markerRef.current);
      markerRef.current = null;

      // Mappls teardown is not safe across rapid step unmount/remount cycles.
      // Clearing the container and dropping references avoids SDK-side destroy errors.
      mapRemovedRef.current = true;

      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }

      mapRef.current = null;
      sdkRef.current = null;
      clickListenerAttachedRef.current = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pin property location
      </label>

      <div className="h-70 overflow-hidden border border-gray-500 rounded">
        {mapError ? (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm px-3 text-center">
            {mapError}
          </div>
        ) : (
          <div
            id={containerId}
            key={containerId}
            ref={mapContainerRef}
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
};

export default OpenStreetPinMap;
