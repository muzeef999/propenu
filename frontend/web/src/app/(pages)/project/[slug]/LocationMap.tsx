"use client";

import { LOCATION_ICON_PATH, LOCATION_ICON_VIEWBOX } from "@/icons/icons";
import { FeaturedProject } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiMapPin } from "react-icons/fi";

type LocationMapProps = {
  project: FeaturedProject;
};

type MapplsPosition = { lat: number; lng: number };

type MapplsMarkerOptions = {
  map: unknown;
  position: MapplsPosition;
  icon?: string;
  width?: number;
  height?: number;
  popupHtml?: string;
};

type MapplsMapOptions = {
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
  location?: boolean;
};

type MapplsMapInstance = {
  remove?: () => void;
  setCenter?: (center: MapplsPosition | [number, number]) => void;
  panTo?: (position: MapplsPosition) => void;
  flyTo?: (options: { center: [number, number]; zoom?: number }) => void;
  setZoom?: (zoom: number) => void;
};

type MapplsGlobal = {
  Map: new (element: string | HTMLElement, options: MapplsMapOptions) => MapplsMapInstance;
  Marker: new (options: MapplsMarkerOptions) => unknown;
};

type MarkerRefItem = {
  marker: unknown;
  coords: [number, number];
};

type MapplsMarkerInstance = {
  openPopup?: () => void;
  togglePopup?: () => void;
  on?: (event: string, cb: () => void) => void;
  addListener?: (event: string, cb: () => void) => void;
};

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
      existingScript.addEventListener("load", () => resolve(), { once: true });
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
    script.onerror = () => {
      delete windowWithCallback[callbackName];
      reject(new Error("Failed to load Mappls SDK script."));
    };

    document.head.appendChild(script);
  });
}

function normalizeCoords(coords?: [number, number] | number[]): [number, number] | undefined {
  if (!Array.isArray(coords) || coords.length < 2) return undefined;

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  if (lng === 0 && lat === 0) return undefined;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return undefined;
  return [lng, lat];
}

function getProjectLocationLabel(project: FeaturedProject) {
  return (
    [project.locality, project.city].filter(Boolean).join(", ") ||
    [project.address, project.city].filter(Boolean).join(", ") ||
    project.title ||
    "Project location"
  );
}

function createMarkerIconDataUrl(colorHex: string, size = 32, useProjectIcon = false) {
  const svgMarkup = useProjectIcon
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${LOCATION_ICON_VIEWBOX}"><path fill="${colorHex}" d="${LOCATION_ICON_PATH}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none"><path d="M16 3.5C10.75 3.5 6.5 7.75 6.5 13c0 6.94 7.39 13.34 8.93 14.59a.9.9 0 0 0 1.14 0C18.11 26.34 25.5 19.94 25.5 13c0-5.25-4.25-9.5-9.5-9.5Z" fill="${colorHex}"/><path d="M16 5.25c4.28 0 7.75 3.47 7.75 7.75 0 5.37-5.3 10.87-7.75 12.99-2.45-2.12-7.75-7.62-7.75-12.99 0-4.28 3.47-7.75 7.75-7.75Z" fill="#ffffff" fill-opacity="0.18"/><circle cx="16" cy="13" r="4.25" fill="#ffffff"/><circle cx="16" cy="13" r="2.1" fill="${colorHex}"/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function removeMarker(map: MapplsMapInstance | null, marker: unknown) {
  const markerAny = marker as {
    remove?: () => void;
    setMap?: (map: unknown) => void;
  };

  if (typeof markerAny.remove === "function") {
    markerAny.remove();
    return;
  }

  if (typeof markerAny.setMap === "function") {
    markerAny.setMap(null);
    return;
  }

  const mapAny = map as { removeLayer?: (layer: unknown) => void } | null;
  if (typeof mapAny?.removeLayer === "function") {
    mapAny.removeLayer(marker);
  }
}

function cleanupMarkerInstances(map: MapplsMapInstance | null, markers: MarkerRefItem[]) {
  markers.forEach((item) => {
    try {
      removeMarker(map, item.marker);
    } catch {
      // Mappls can throw during teardown if its internal layer is already gone.
    }
  });
}

function focusMapOn(map: MapplsMapInstance | null, coords: [number, number]) {
  if (!map) return;

  const [lng, lat] = coords;
  const target = { lat, lng };

  try {
    if (typeof map.setCenter === "function") {
      map.setCenter(target);
    } else if (typeof map.panTo === "function") {
      map.panTo(target);
    } else if (typeof map.flyTo === "function") {
      map.flyTo({ center: [lat, lng], zoom: 14 });
    }

    if (typeof map.setZoom === "function") map.setZoom(14);
  } catch (error) {
    console.warn("Mappls focus error:", error);
  }
}

function openMarkerPopup(marker: unknown) {
  const markerAny = marker as MapplsMarkerInstance;

  if (typeof markerAny.openPopup === "function") {
    markerAny.openPopup();
    return;
  }

  if (typeof markerAny.togglePopup === "function") {
    markerAny.togglePopup();
  }
}

export default function LocationMap({ project }: LocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY || process.env.NEXT_MAPPLS_MAP_SDK_KEY;
  const mapContainerId = "project-location-mappls-map";
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapplsMapInstance | null>(null);
  const markersRef = useRef<MarkerRefItem[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const color = project.color?.trim() || "#10b981";
  const projectCenter = useMemo(
    () => normalizeCoords(project.location?.coordinates),
    [project.location?.coordinates],
  );
  const projectLocationLabel = useMemo(() => getProjectLocationLabel(project), [project]);
  const nearbyLocations = useMemo(
    () =>
      (project.nearbyPlaces ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((place) => ({
          name: place.name?.split(",")[0]?.trim(),
          distanceText: place.distanceText?.trim(),
        }))
        .filter((place) => place.name && place.distanceText),
    [project.nearbyPlaces],
  );

  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!apiKey) {
        setMapError("Mappls API key is missing. Set NEXT_PUBLIC_MAPPLS_MAP_SDK_KEY in .env.");
        return;
      }

      if (!mapRef.current) return;

      if (!projectCenter) return;
      const center = projectCenter;

      try {
        setMapError(null);
        await loadMapplsScript(apiKey);
        if (isCancelled) return;

        const mapplsSdk = getMapplsGlobal();
        if (!mapplsSdk || !mapRef.current) {
          throw new Error("Mappls SDK loaded but API object is unavailable.");
        }

        mapRef.current.replaceChildren();

        mapInstanceRef.current = new mapplsSdk.Map(mapContainerId, {
          center: [center[1], center[0]],
          zoom: 14,
          zoomControl: false,
          location: false,
        });

        const map = mapInstanceRef.current;

        const addMarkers = () => {
          cleanupMarkerInstances(map, markersRef.current);
          markersRef.current = [];

          const [lng, lat] = center;
          const mainMarker = new mapplsSdk.Marker({
            map,
            position: { lat, lng },
            icon: createMarkerIconDataUrl(color, 36, true),
            width: 36,
            height: 36,
            popupHtml: `<div style="font-weight:600">${escapeHtml(project.title || "Project location")}</div><div style="font-size:12px;color:#444;margin-top:4px">${escapeHtml(projectLocationLabel)}</div>`,
          });

          markersRef.current.push({ marker: mainMarker, coords: center });
          focusMapOn(map, center);
        };

        const mapAny = map as {
          getCanvasContainer?: () => unknown;
          on?: (event: string, cb: () => void) => void;
          addListener?: (event: string, cb: () => void) => void;
        };

        if (typeof mapAny.getCanvasContainer === "function") {
          addMarkers();
        } else if (typeof mapAny.on === "function") {
          mapAny.on("load", addMarkers);
        } else if (typeof mapAny.addListener === "function") {
          mapAny.addListener("load", addMarkers);
        } else {
          window.setTimeout(addMarkers, 200);
        }
        setMapReady(true);
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Unable to load Mappls map right now.";
          setMapError(message);
          console.error("Mappls init error:", error);
        }
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      cleanupMarkerInstances(mapInstanceRef.current, markersRef.current);
      markersRef.current = [];
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [apiKey, color, mapContainerId, project.title, projectCenter, projectLocationLabel]);

  if (!projectCenter) {
    return null;
  }

  function onProjectLocationClick() {
    if (!projectCenter) return;

    focusMapOn(mapInstanceRef.current, projectCenter);

    const markerItem = markersRef.current[0];
    if (mapReady && markerItem) {
      window.setTimeout(() => openMarkerPopup(markerItem.marker), 120);
    }
  }

  return (
    <section id="location" className="scroll-mt-20">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            Location
          </h2>
          <div className="p-3 sm:p-5">
            <div className="space-y-4 sm:space-y-5">
              <div className="relative overflow-hidden rounded-md border border-slate-100 shadow-sm contain-paint isolate">
                {mapError ? (
                  <div className="flex h-[260px] w-full items-center justify-center px-4 text-center text-sm text-slate-500 sm:h-[420px]">
                    {mapError}
                  </div>
                ) : (
                  <div id={mapContainerId} ref={mapRef} className="h-[260px] w-full overflow-hidden sm:h-[420px]" />
                )}
              </div>

              <div className="rounded-md">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                  <button
                    type="button"
                    onClick={onProjectLocationClick}
                    className="flex w-full cursor-pointer items-start gap-2 rounded-md border border-emerald-400 bg-white p-2 text-left shadow-sm transition sm:gap-3 sm:p-3"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9"
                      style={{ backgroundColor: `${color}14`, color }}
                    >
                      <FiMapPin className="h-4 w-4" />
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-slate-950 sm:text-sm">
                        {projectLocationLabel}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-slate-500 sm:text-xs">
                        Project location
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {nearbyLocations.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-950 sm:text-base">Additional locations</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {nearbyLocations.map((place, index) => (
                      <div
                        key={`${place.name}-${index}`}
                        className="flex min-w-0 items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-2.5 text-sm text-slate-900"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                          style={{ backgroundColor: `${color}10`, borderColor: color, color }}
                        >
                          <FiCheck className="h-3 w-3" />
                        </span>
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="truncate font-medium text-slate-950">{place.name}</span>
                          <span className="shrink-0 font-semibold text-slate-700">({place.distanceText})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
