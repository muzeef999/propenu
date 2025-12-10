import axios from "axios";

export async function geocode(place: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    place
  )}&format=json&limit=1`;

  const { data } = await axios.get(url, {
    headers: { "User-Agent": "YourAppName/1.0" }
  });

  if (!data || data.length === 0) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon)
  };
}
