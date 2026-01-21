"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function createMarkerIcon(
  L: typeof import("leaflet"),
  color = "#27AE60",
  size = 28
) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `);

  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${svg}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/** convert any coords value to [lng, lat] tuple or undefined */
function normalizeCoords(coords?: [number, number] | number[] | undefined): [number, number] | undefined {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return undefined;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return [lng, lat];
}

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

const NearByPlace: React.FC<Props> = ({
  projectLocation,
  projectName,
  nearbyPlaces,
}) => {
  const projectCoords = normalizeCoords(projectLocation.coordinates);

  if (!projectCoords) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg text-gray-500">
        Project location not available.
      </div>
    );
  }

  // Leaflet expects [latitude, longitude]
  const center: [number, number] = [projectCoords[1], projectCoords[0]];

  const filteredNearbyPlaces = nearbyPlaces.filter(place => normalizeCoords(place.coordinates));

  const projectIcon = createMarkerIcon(L, "#27AE60", 36);
  const nearbyIcon = createMarkerIcon(L, "#27AE60", 28);

  return (
    <MapContainer center={center} zoom={14} style={{ height: 400, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={center} icon={projectIcon}>
        <Popup>{projectName}</Popup>
      </Marker>

      {filteredNearbyPlaces.map((place, index) => {
        const placeCoords = normalizeCoords(place.coordinates);
        if (!placeCoords) return null;

        // Leaflet expects [lat, lng]
        const position: [number, number] = [placeCoords[1], placeCoords[0]];

        return (
          <Marker
            key={`${place.name ?? "place"}-${index}`}
            icon={nearbyIcon}
            position={position}
          >
            <Popup>
              <b>{place.name}</b>
              <br />
              {place.type}
              <br />
              {place.distanceText}
            </Popup>
          </Marker>
        );
      })}

    </MapContainer>
  );
};

export default NearByPlace;
