"use client";
import { useState } from "react";

export function useLocationPermission() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  const requestAccess = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("granted");
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return { status, coords, requestAccess };
}
