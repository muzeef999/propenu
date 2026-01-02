"use client";

import React from "react";
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
  const center: [number, number] = [
    projectLocation.coordinates[1],
    projectLocation.coordinates[0],
  ];

  const projectIcon = createMarkerIcon(L, "#27AE60", 36);
  const nearbyIcon = createMarkerIcon(L, "#27AE60", 28);

  return (
    <MapContainer center={center} zoom={14} style={{ height: 400, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={center} icon={projectIcon}>
        <Popup>{projectName}</Popup>
      </Marker>

      {nearbyPlaces.map((place, index) => {
        if (!place.coordinates) return null;

        return (
          <Marker
            key={index}
            icon={nearbyIcon}
            position={[place.coordinates[1], place.coordinates[0]]}
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
