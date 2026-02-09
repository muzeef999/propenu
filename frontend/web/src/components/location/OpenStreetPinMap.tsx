"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDispatch, useSelector } from "react-redux";
import { setBaseField } from "@/Redux/slice/postPropertySlice";
import { useEffect, useState } from "react";

type OpenStreetPinMapProps = {
  coordinates?: [number, number]; // [lng, lat]
};


// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const defaultPosition: [number, number] = [12.9716, 77.5946]; // Bengaluru

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
    });
  }, [center, map]);

  return null;
};

const DraggableMarker = ({ center }: { center: [number, number] }) => {
  const dispatch = useDispatch();
  const [position, setPosition] = useState(center);

  // 🔄 Sync marker when center changes
  useEffect(() => {
    setPosition(center);
  }, [center]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      dispatch(
        setBaseField({
          key: "location",
          value: {
            type: "Point",
            coordinates: [lng, lat],
          },
        })
      );
    },
  });

  return <Marker position={position} draggable />;
};

const OpenStreetPinMap = ({ coordinates }: OpenStreetPinMapProps) => {
  const center: [number, number] =
    coordinates && coordinates.length === 2
      ? [coordinates[1], coordinates[0]] // lat, lng
      : defaultPosition;


  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pin property location
      </label>

      <div className="h-52 overflow-hidden border border-gray-500 rounded">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={center} />

          <DraggableMarker center={center} />
        </MapContainer>
      </div>
    </div>
  );
};

export default OpenStreetPinMap;
