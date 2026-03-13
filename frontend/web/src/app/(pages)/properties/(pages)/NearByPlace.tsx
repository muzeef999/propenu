"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LOCATION_ICON_PATH, LOCATION_ICON_VIEWBOX } from "@/icons/icons";

interface Location {
  type: "Point";
  coordinates: [number, number];
}

interface NearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number];
}

interface Props {
  projectLocation: Location;
  projectName: string;
  nearbyPlaces: NearbyPlace[];
  focusedPlace?: NearbyPlace;
}

type MapplsPosition = { lat: number; lng: number };

type MapplsMarkerOptions = {
  map: unknown;
  position: MapplsPosition;
  icon?: string;
  width?: number;
  height?: number;
  popupHtml?: string;
  fitbounds?: boolean;
};

type MapplsMapOptions = {
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
  location?: boolean;
};

type MapplsInstance = {
  remove?: () => void;
  setCenter?: (center: MapplsPosition | [number, number]) => void;
  setZoom?: (zoom: number) => void;
  panTo?: (position: MapplsPosition) => void;
  flyTo?: (options: { center: [number, number]; zoom?: number }) => void;
};

type MapplsMarkerInstance = {
  remove?: () => void;
  setMap?: (map: unknown) => void;
};

type MapplsGlobal = {
  Map: new (element: string | HTMLElement, options: MapplsMapOptions) => MapplsInstance;
  Marker: new (options: MapplsMarkerOptions) => MapplsMarkerInstance;
};

function createMarkerIconDataUrl(color = "#27AE60", size = 28) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${LOCATION_ICON_VIEWBOX}">
      <path fill="${color}" d="${LOCATION_ICON_PATH}"/>
    </svg>
  `);

  return `data:image/svg+xml;utf8,${svg}`;
}

function normalizeCoords(coords?: [number, number] | number[]) {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return undefined;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return [lng, lat] as [number, number];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function buildNearbyPopupHtml(place: NearbyPlace) {
  const name = escapeHtml(place.name ?? "Nearby place");
  const type = escapeHtml(place.type ?? "");
  const distance = escapeHtml(place.distanceText ?? "");

  return `<div><b>${name}</b><br/>${type}<br/>${distance}</div>`;
}

function getMapplsGlobal() {
  const win = window as unknown as { mappls?: MapplsGlobal; Mappls?: MapplsGlobal };
  return win.mappls ?? win.Mappls;
}

function cleanupMapInstance(map: MapplsInstance | null) {
  try {
    map?.remove?.();
  } catch {
    // Mappls can throw during dev cleanup if the map was only partially initialized.
  }
}

function cleanupMarkerInstances(markers: MapplsMarkerInstance[]) {
  markers.forEach((marker) => {
    try {
      marker.remove?.();
      marker.setMap?.(null);
    } catch {
      // Ignore SDK cleanup issues; we fully rebuild markers after data changes.
    }
  });
}

function loadMapplsScript(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (getMapplsGlobal()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-mappls-sdk='true']");
    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          if (getMapplsGlobal()) resolve();
          else reject(new Error("Mappls SDK loaded but global object was not found."));
        },
        { once: true }
      );
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Mappls SDK")), {
        once: true,
      });
      return;
    }

    const callbackName = `__mapplsInit_${Date.now()}`;
    const windowWithCallback = window as unknown as Record<string, unknown>;
    windowWithCallback[callbackName] = () => {
      delete windowWithCallback[callbackName];
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.mapplsSdk = "true";
    script.onload = () => {
      if (getMapplsGlobal()) {
        delete windowWithCallback[callbackName];
        resolve();
      }
    };
    script.onerror = () => {
      delete windowWithCallback[callbackName];
      reject(new Error("Failed to load Mappls SDK script."));
    };
    document.head.appendChild(script);
  });
}

const NearByPlace: React.FC<Props> = ({
  projectLocation,
  projectName,
  nearbyPlaces,
  focusedPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapplsInstance | null>(null);
  const markerInstancesRef = useRef<MapplsMarkerInstance[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const fallbackCenter: [number, number] = [28.6139, 77.209];

  const apiKey =
    process.env.NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY ||
    process.env.NEXT_MAPPLS_MAP_SDK_KEY;

  const projectCoords = useMemo(
    () => normalizeCoords(projectLocation.coordinates),
    [projectLocation.coordinates]
  );
  const mapCenter = useMemo<[number, number]>(
    () => (projectCoords ? [projectCoords[1], projectCoords[0]] : fallbackCenter),
    [projectCoords]
  );
  const filteredNearbyPlaces = useMemo(
    () => nearbyPlaces.filter((place) => normalizeCoords(place.coordinates)),
    [nearbyPlaces]
  );
  const focusedCoords = useMemo(
    () => normalizeCoords(focusedPlace?.coordinates),
    [focusedPlace?.coordinates]
  );

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!apiKey) {
        setMapError("Mappls API key is missing. Set NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY in .env.");
        return;
      }

      if (!mapContainerRef.current || mapInstanceRef.current) {
        return;
      }

      try {
        setMapError(null);
        await loadMapplsScript(apiKey);

        const mapplsSdk = getMapplsGlobal();
        if (isCancelled || !mapplsSdk || !mapContainerRef.current || mapInstanceRef.current) {
          return;
        }

        // React dev mount cycles can leave partial SDK DOM behind in the same container.
        // Clearing it before creating the map avoids Mappls trying to destroy stale state.
        mapContainerRef.current.replaceChildren();

        const map = new mapplsSdk.Map(mapContainerRef.current, {
          center: mapCenter,
          zoom: projectCoords ? 12 : 5,
          zoomControl: true,
          location: false,
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Unable to load Mappls map right now.";
          setMapError(message);
          console.error("Mappls init error:", error);
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      cleanupMarkerInstances(markerInstancesRef.current);
      markerInstancesRef.current = [];
      // Avoid aggressive SDK teardown during transient dev unmount/remount cycles.
      // Clearing our refs is enough; a fresh map will be created on the next stable mount.
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [apiKey, mapCenter, projectCoords]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapplsSdk = getMapplsGlobal();
    if (!mapReady || !map || !mapplsSdk) return;

    cleanupMarkerInstances(markerInstancesRef.current);
    markerInstancesRef.current = [];

    if (projectCoords) {
      const projectMarker = new mapplsSdk.Marker({
        map,
        position: { lat: projectCoords[1], lng: projectCoords[0] },
        icon: createMarkerIconDataUrl("#27AE60", 36),
        width: 36,
        height: 36,
        popupHtml: `<div><b>${escapeHtml(projectName)}</b></div>`,
        fitbounds: true,
      });
      markerInstancesRef.current.push(projectMarker);
    }

    const nearbyIcon = createMarkerIconDataUrl("#1D4ED8", 30);
    filteredNearbyPlaces.forEach((place) => {
      const placeCoords = normalizeCoords(place.coordinates);
      if (!placeCoords) return;

      const marker = new mapplsSdk.Marker({
        map,
        position: { lat: placeCoords[1], lng: placeCoords[0] },
        icon: nearbyIcon,
        width: 30,
        height: 30,
        popupHtml: buildNearbyPopupHtml(place),
      });
      markerInstancesRef.current.push(marker);
    });
  }, [filteredNearbyPlaces, mapReady, projectCoords, projectName]);

  useEffect(() => {
    if (!mapReady || !focusedCoords || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const target = { lat: focusedCoords[1], lng: focusedCoords[0] };

    try {
      if (typeof map.setCenter === "function") {
        map.setCenter(target);
      } else if (typeof map.panTo === "function") {
        map.panTo(target);
      }

      if (typeof map.setZoom === "function") {
        map.setZoom(15);
      }
    } catch (error) {
      console.warn("Mappls focus error:", error);
    }

    mapContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [focusedCoords, mapReady]);

  return (
    <div className="relative">
      <div id="nearby-mappls-map" ref={mapContainerRef} style={{ height: 400, width: "100%" }} />
      {mapError ? (
        <div className="absolute inset-x-4 top-4 rounded-md bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-sm">
          {mapError}
        </div>
      ) : null}
      {!projectCoords ? (
        <div className="absolute inset-x-4 bottom-4 rounded-md bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-sm">
          Project location not available. Showing default map area.
        </div>
      ) : null}
    </div>
  );
};

export default NearByPlace;
