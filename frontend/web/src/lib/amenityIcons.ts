// lib/amenityIcons.ts
const DEFAULT_AMENITY_ICON = "/icons/amenities/default.svg";

const AMENITY_ICON_ALIASES: Record<string, string> = {
  elevator_lift: "/icons/amenities/elevator.svg",
  clubhouse: "/icons/amenities/clubhouse.svg",
  club_house: "/icons/amenities/club_house.svg",
  cctv: "/icons/amenities/cctv_surveillance.svg",
  cctv_video_surveillance: "/icons/amenities/cctv_video_surveillance.svg",
  basketball: "/icons/amenities/Basketball.svg",
  bowling: "/icons/amenities/Bowling.svg",
  children_play: "/icons/amenities/kids_play_area.svg",
  children_play_area: "/icons/amenities/kids_play_area.svg",
  childrens_play_area: "/icons/amenities/childrens_play_area.svg",
  cricket: "/icons/amenities/Cricket.svg",
  greenhouse: "/icons/amenities/Greenhouse.svg",
  gym: "/icons/amenities/gym.svg",
  hypermarket: "/icons/amenities/Hypermarket.svg",
  jacuzzi: "/icons/amenities/Jacuzzi.svg",
  jogging: "/icons/amenities/Jogging.svg",
  jogging_track: "/icons/amenities/Jogging.svg",
  park: "/icons/amenities/Park.svg",
  rainwater_harvesting: "/icons/amenities/rainwater_harvesting.svg",
  rain_water_harvesting: "/icons/amenities/rain_water_harvesting.svg",
  rugby: "/icons/amenities/Rugby.svg",
  sauna: "/icons/amenities/Sauna.svg",
  spa: "/icons/amenities/Spa.svg",
  volleyball: "/icons/amenities/Volleyball.svg",
};

function normalizeAmenityIconKey(value?: string) {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, " ")
    .trim()
    .replace(/\s+/g, "_");
}

export function amenityTitleToIconPath(title?: string) {
  const key = normalizeAmenityIconKey(title);
  if (!key) return DEFAULT_AMENITY_ICON;

  return AMENITY_ICON_ALIASES[key] ?? `/icons/amenities/${key}.svg`;
}
