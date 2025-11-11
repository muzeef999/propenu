"use client";
import { useEffect, useState } from "react";

export function useCity() {
  const [city, setCity] = useState("Hyderabad"); // ✅ default fallback

  useEffect(() => {
    // If already saved, reuse it (no popup)
    const saved = localStorage.getItem("user_city");
    if (saved) {
      setCity(saved);
      return;
    }

    // Ask permission
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const res = await fetch(`${process.env.API_URL}/api/users/locations/reverse?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const detected = data.city || data.state || data.country || "Hyderabad";
          setCity(detected);
          localStorage.setItem("user_city", detected); // Save for next visit
        } catch {
          setCity("Hyderabad");
        }
      },
      () => {
        // ❌ Permission denied → use Hyderabad
        setCity("Hyderabad");
      }
    );
  }, []);

  return { city, setCity };
}
