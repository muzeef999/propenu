// lib/amenityIcons.ts
const DEFAULT_AMENITY_ICON = "/icons/amenities/default.svg";

const AMENITY_ICON_ALIASES: Record<string, string> = {
  "elevator/lift": "/icons/amenities/elevator.svg",
  clubhouse: "/icons/amenities/clubhouse.svg",
  club_house: "/icons/amenities/club_house.svg",
  cctv: "/icons/amenities/cctv_surveillance.svg",
  cctv_video_surveillance: "/icons/amenities/cctv_video_surveillance.svg",
  children_play: "/icons/amenities/kids_play_area.svg",
  children_play_area: "/icons/amenities/kids_play_area.svg",
  childrens_play_area: "/icons/amenities/childrens_play_area.svg",
  gym: "/icons/amenities/gym.svg",
  jogging: "/icons/amenities/Jogging.svg",
  jogging_track: "/icons/amenities/Jogging.svg",
  rainwater_harvesting: "/icons/amenities/rainwater_harvesting.svg",
  rain_water_harvesting: "/icons/amenities/rain_water_harvesting.svg",
};

function normalizeAmenityIconKey(value?: string) {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export function amenityTitleToIconPath(title?: string) {
  const key = normalizeAmenityIconKey(title);
  if (!key) return DEFAULT_AMENITY_ICON;

  return AMENITY_ICON_ALIASES[key] ?? `/icons/amenities/${key}.svg`;
}
