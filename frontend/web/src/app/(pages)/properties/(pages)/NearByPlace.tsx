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
};

type MapplsGlobal = {
  Map: new (element: string | HTMLElement, options: MapplsMapOptions) => MapplsInstance;
  Marker: new (options: MapplsMarkerOptions) => unknown;
};

function createMarkerIconDataUrl(color = "#27AE60", size = 28) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${LOCATION_ICON_VIEWBOX}">
      <path fill="${color}" d="${LOCATION_ICON_PATH}"/>
    </svg>
  `);

  return `data:image/svg+xml;utf8,${svg}`;
}

function normalizeCoords(coords?: [number, number] | number[]): [number, number] | undefined {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return undefined;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return [lng, lat];
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
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Mappls SDK")), { once: true });
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
      // Some SDK variants don't invoke callback; handle that fallback.
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

const NearByPlace: React.FC<Props> = ({ projectLocation, projectName, nearbyPlaces }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapplsInstance | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY ||
    process.env.NEXT_MAPPLS_MAP_SDK_KEY;

  const projectCoords = normalizeCoords(projectLocation.coordinates);

  const filteredNearbyPlaces = useMemo(
    () => nearbyPlaces.filter((place) => normalizeCoords(place.coordinates)),
    [nearbyPlaces]
  );

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!apiKey) {
        setMapError("Mappls API key is missing. Set NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY in .env.");
        return;
      }

      if (!projectCoords || !mapContainerRef.current) {
        return;
      }

      try {
        setMapError(null);
        await loadMapplsScript(apiKey);

        const mapplsSdk = getMapplsGlobal();
        if (isCancelled || !mapplsSdk || !mapContainerRef.current) {
          return;
        }

        if (mapInstanceRef.current?.remove) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = new mapplsSdk.Map("nearby-mappls-map", {
          center: [projectCoords[1], projectCoords[0]],
          zoom: 14,
          zoomControl: true,
          location: false,
        });

        mapInstanceRef.current = map;

        const projectIcon = createMarkerIconDataUrl("#27AE60", 36);
        new mapplsSdk.Marker({
          map,
          position: { lat: projectCoords[1], lng: projectCoords[0] },
          icon: projectIcon,
          width: 36,
          height: 36,
          popupHtml: `<div><b>${escapeHtml(projectName)}</b></div>`,
          fitbounds: true,
        });

        const nearbyIcon = createMarkerIconDataUrl("#27AE60", 28);

        filteredNearbyPlaces.forEach((place) => {
          const placeCoords = normalizeCoords(place.coordinates);
          if (!placeCoords) return;

          new mapplsSdk.Marker({
            map,
            position: { lat: placeCoords[1], lng: placeCoords[0] },
            icon: nearbyIcon,
            width: 28,
            height: 28,
            popupHtml: buildNearbyPopupHtml(place),
          });
        });
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
      if (mapInstanceRef.current?.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey, filteredNearbyPlaces, projectCoords, projectName]);

  if (!projectCoords) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg text-gray-500">
        Project location not available.
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg text-gray-500 text-center px-4">
        {mapError}
      </div>
    );
  }

  return <div id="nearby-mappls-map" ref={mapContainerRef} style={{ height: 400, width: "100%" }} />;
};

export default NearByPlace;
