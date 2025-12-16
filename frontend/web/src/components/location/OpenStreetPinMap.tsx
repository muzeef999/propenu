"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDispatch } from "react-redux";
import { setLocationField } from "@/Redux/slice/postPropertySlice";
import { useState } from "react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const defaultPosition: [number, number] = [12.9716, 77.5946]; // Bengaluru

const DraggableMarker = () => {
  const dispatch = useDispatch();
  const [position, setPosition] = useState(defaultPosition);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      dispatch(
        setLocationField({
          key: "location",
          value: {
            type: "Point",
            coordinates: [lng, lat], // GeoJSON format
          },
        })
      );
    },
  });

  return <Marker position={position} draggable />;
};

const OpenStreetPinMap = () => {
  return (
    <div className="space-y-2">
      <label className="inline-block text-sm font-normal  m-0 p-1 bg-gray-400 text-white rounded-t-sm">
        Pin property location
      </label>
      <div className="h-52 rounded-b-sm rounded-r-sm overflow-hidden border border-gray-500">
        <MapContainer
          center={defaultPosition}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">
        Click on the map to mark the exact location of your property.
      </p>
    </div>
  );
};

export default OpenStreetPinMap;
