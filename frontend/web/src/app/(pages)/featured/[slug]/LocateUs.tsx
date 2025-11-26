// components/LocateUs.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * NearbyPlace / Geo types
 */
type NearbyPlace = {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number] | number[]; // lng, lat or number[]
  order?: number;
};

type GeoPoint = {
  type: "Point";
  coordinates?: [number, number] | number[]; // lng, lat
};

/**
 * Payload shape you passed from page
 */
type LocatePayload = {
  nearbyPlaces?: NearbyPlace[] | null;
  location?: GeoPoint | null;
  color?: string | null;
  heading?: string | null;
};

/**
 * Component props: accept either an array OR the payload object
 */
type Props = {
  nearbyPlaces?: NearbyPlace[] | LocatePayload | null;
  primaryColor?: string | null; // explicit override if provided
  location?: GeoPoint | null; // explicit override if provided
  heading?: string | null;
};

const FALLBACK_ICON = "/mnt/data/f4268fce-6dcc-4577-b9d7-02ddeb34758c.png";

/** loads Leaflet from CDN (same as your original helper) */
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("No window");
  if ((window as any).L) return Promise.resolve((window as any).L);

  return new Promise((resolve, reject) => {
    const href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    if (document.querySelector(`script[src="${src}"]`)) {
      const check = () => {
        if ((window as any).L) resolve((window as any).L);
        else setTimeout(check, 50);
      };
      check();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).L) resolve((window as any).L);
      else reject(new Error("Leaflet loaded but L not present"));
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

/** haversine distance (meters) */
function haversine([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** convert any coords value to [lng, lat] tuple or undefined */
function normalizeCoords(coords?: [number, number] | number[] | undefined): [number, number] | undefined {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return undefined;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return [lng, lat];
}

/** NORMALIZER: accept both array or payload object */
function normalizeIncoming(
  incoming?: NearbyPlace[] | LocatePayload | null,
  explicitLocation?: GeoPoint | null,
  explicitColor?: string | null,
  explicitHeading?: string | null
) {
  // If array passed directly
  if (Array.isArray(incoming)) {
    return {
      places: incoming as NearbyPlace[],
      location: explicitLocation ?? null,
      color: explicitColor ?? "#F59E0B",
      heading: explicitHeading ?? "Locate Us",
    };
  }

  // incoming is payload or null/undefined
  const p = (incoming || {}) as LocatePayload;
  return {
    places: Array.isArray(p.nearbyPlaces) ? p.nearbyPlaces : [],
    location: explicitLocation ?? p.location ?? null,
    color: explicitColor ?? p.color ?? "#F59E0B",
    heading: explicitHeading ?? p.heading ?? "Locate Us",
  };
}

export default function LocateUs({ nearbyPlaces: raw, primaryColor, location: explicitLocation, heading: headingProp }: Props) {
  // normalize once
  const { places, location, color, heading } = useMemo(
    () => normalizeIncoming(raw, explicitLocation ?? null, primaryColor ?? null, headingProp ?? null),
    [raw, primaryColor, explicitLocation, headingProp]
  );

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [Lobj, setLobj] = useState<any | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // project center tuple
  const projectCenter = useMemo(() => {
    if (!location) return undefined;
    return normalizeCoords(location.coordinates);
  }, [location]);

  // attach __coordsTuple for each place
  const normalizedPlaces = useMemo(
    () => (Array.isArray(places) ? places.map((p) => ({ ...p, __coordsTuple: normalizeCoords(p.coordinates) })) : []),
    [places]
  );

  // compute distances if project center available
  const withDistance = useMemo(() => {
    return normalizedPlaces.map((item) => {
      const coords = (item as any).__coordsTuple as [number, number] | undefined;
      if (!projectCenter || !coords) return { p: item as NearbyPlace, distance: undefined, distanceText: item.distanceText };
      const meters = haversine(projectCenter, coords);
      const dt = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
      return { p: item as NearbyPlace, distance: meters, distanceText: dt, coords };
    });
  }, [normalizedPlaces, projectCenter]);

  // load Leaflet
  useEffect(() => {
    let alive = true;
    loadLeaflet()
      .then((L) => {
        if (!alive) return;
        setLobj(L);
      })
      .catch((e) => {
        console.error("Leaflet load failed", e);
      });
    return () => {
      alive = false;
    };
  }, []);

  // initialize / update map and markers
  useEffect(() => {
    if (!Lobj || !mapRef.current) return;

    // create map if not exists
    if (!leafletMapRef.current) {
      const map = Lobj.map(mapRef.current, {
        center: projectCenter ? [projectCenter[1], projectCenter[0]] : [0, 0],
        zoom: projectCenter ? 13 : 2,
        zoomControl: true,
        attributionControl: true,
      });

      Lobj.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // clear previous markers
    for (const m of markersRef.current) {
      try {
        map.removeLayer(m);
      } catch {}
    }
    markersRef.current = [];

    // create marker icon helper
    function createMarkerIcon(colorHex: string, size = 28, useImage = false, imageUrl?: string) {
      if (useImage && imageUrl) {
        return Lobj.icon({
          iconUrl: imageUrl,
          iconSize: [36, 36],
          className: "rounded-marker",
        });
      }
      const svg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${colorHex}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`
      );
      const url = `data:image/svg+xml;utf8,${svg}`;
      return Lobj.icon({
        iconUrl: url,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    }

    // add main project marker
    if (projectCenter) {
      const [lng, lat] = projectCenter;
      const mainIcon = createMarkerIcon(color, 36, true, FALLBACK_ICON);
      const marker = Lobj.marker([lat, lng], { icon: mainIcon }).addTo(map);
      marker.bindPopup(`<strong>Project location</strong>`);
      markersRef.current.push(marker);
    }

    // add nearby markers
    for (let i = 0; i < withDistance.length; i++) {
      const item = withDistance[i];
      const coords = (item as any).coords as [number, number] | undefined;
      if (!coords) continue;
      const [lng, lat] = coords;
      const icon = createMarkerIcon(color, 28, false);
      const m = Lobj.marker([lat, lng], { icon }).addTo(map);
      const popupHtml = `<div style="font-weight:600">${item.p.name ?? "Place"}</div><div style="font-size:12px;color:#444;margin-top:4px">${item.p.type ?? ""} • ${item.distanceText ?? ""}</div>`;
      m.bindPopup(popupHtml);
      m.on("click", () => setSelectedIndex(i));
      markersRef.current.push(m);
    }

    // fit bounds if markers exist
    if (markersRef.current.length > 0) {
      const group = Lobj.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    } else if (projectCenter) {
      map.setView([projectCenter[1], projectCenter[0]], 14);
    }

    return () => {
      for (const m of markersRef.current) {
        try {
          map.removeLayer(m);
        } catch {}
      }
      markersRef.current = [];
    };
  }, [Lobj, projectCenter, withDistance, color]);

  function onSelectPlace(index: number) {
    setSelectedIndex(index);
    // marker index offset: if projectCenter present we added main marker first
    const offset = projectCenter ? 1 : 0;
    const marker = markersRef.current[index + offset];
    if (marker && marker.openPopup) {
      marker.openPopup();
      const map = leafletMapRef.current;
      if (map) {
        const latlng = marker.getLatLng();
        map.panTo(latlng);
      }
    }
  }

  const isHex = typeof color === "string" && color.startsWith("#");

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{heading}</h2>
          <p className="mt-1 text-sm text-slate-600">Nearby places and directions (OpenStreetMap)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm">
            <div ref={mapRef} className="w-full h-[430px] sm:h-[520px]" />
          </div>
          <div className="mt-3 text-xs text-slate-500">Click markers to open details. Click a list item to focus that marker.</div>
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nearby Places</h3>

            <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {withDistance.length === 0 && <li className="text-sm text-slate-500">No nearby places provided.</li>}
              {withDistance.map(({ p, distanceText }, idx) => {
                const active = selectedIndex === idx;
                const coords = (normalizedPlaces[idx] as any).__coordsTuple as [number, number] | undefined;
                return (
                  <li
                    key={`${p.name ?? "place"}-${idx}`}
                    onClick={() => onSelectPlace(idx)}
                    className={`cursor-pointer rounded-md p-3 transition ${active ? "ring-2 ring-offset-2" : "hover:bg-slate-50"}`}
                    style={{ boxShadow: active ? `0 6px 20px ${color}22` : undefined } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: isHex ? `${color}11` : undefined }}>
                            <img src={FALLBACK_ICON} alt={p.name} className="w-7 h-7 object-cover rounded-sm" />
                          </div>
                          <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{p.type ?? "Place"} • {distanceText ?? p.distanceText ?? "—"}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">{p.order}</div>
                        <div className="text-xs text-slate-400">{coords ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : ""}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
