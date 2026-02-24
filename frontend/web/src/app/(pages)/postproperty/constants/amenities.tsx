// constants/amenities.tsx

import {
  FaDumbbell,
  FaSwimmingPool,
  FaRunning,
  FaChild,
  FaCar,
  FaShieldAlt,
  FaFireExtinguisher,
  FaVideo,
  FaLeaf,
  FaRecycle,
} from "react-icons/fa";

import {
  MdElevator,
  MdPower,
  MdNature,
  MdWbSunny,
} from "react-icons/md";

import { GiCctvCamera } from "react-icons/gi";
import { BsHouseDoor } from "react-icons/bs";


export type AmenityCategory =
  | "Sports"
  | "Convenience"
  | "Safety"
  | "Environment";

export const RESIDENTIAL_AMENITIES = [
  // 🏃 Sports
  {
    key: "gym",
    title: "Gym",
    category: "Sports",
    icon: "/icons/amenities/Gym.svg",
  },
  {
    key: "swimming_pool",
    title: "Swimming Pool",
    category: "Sports",
    icon: "/icons/amenities/Swimming Pool.svg",
  },
  {
    key: "jogging_track",
    title: "Jogging Track",
    category: "Sports",
    icon: "/icons/amenities/Jogging Track.svg",
  },
  {
    key: "children_play",
    title: "Children's Play Area",
    category: "Sports",
    icon: "/icons/amenities/kids play area.svg",
  },

  // 🏢 Convenience
  {
    key: "lift",
    title: "Lift",
    category: "Convenience",
    icon: "/icons/amenities/Lift.svg ",
  },
  {
    key: "power_backup",
    title: "Power Backup",
    category: "Convenience",
    icon: "/icons/amenities/Power Backup.svg",
  },
  {
    key: "club_house",
    title: "Club House",
    category: "Convenience",
    icon: "/icons/amenities/Club House.svg",
  },
  {
    key: "visitor_parking",
    title: "Visitor Parking",
    category: "Convenience",
    icon: "/icons/amenities/Visitor Parking.svg",
  },

  // 🔐 Safety
  {
    key: "security",
    title: "24x7 Security",
    category: "Safety",
    icon: "/icons/amenities/24x7 Security.svg",
  },
  {
    key: "cctv",
    title: "CCTV Surveillance",
    category: "Safety",
    icon: "/icons/amenities/CCTV Surveillance.svg",
  },
  {
    key: "fire_safety",
    title: "Fire Safety",
    category: "Safety",
    icon: "/icons/amenities/Fire Safety.svg",
  },
  {
    key: "video_door_phone",
    title: "Video Door Phone",
    category: "Safety",
    icon: <FaVideo size={26} />,
  },

  // 🌱 Environment
  {
    key: "garden",
    title: "Garden",
    category: "Environment",
    icon: "/icons/amenities/Garden.svg",
  },
  {
    key: "rainwater_harvesting",
    title: "Rainwater Harvesting",
    category: "Environment",
    icon: "/icons/amenities/Rainwater Harvesting.svg",
  },
  {
    key: "solar_lighting",
    title: "Solar Lighting",
    category: "Environment",
    icon: <MdWbSunny size={26} />,
  },
  {
    key: "waste_management",
    title: "Waste Management",
    category: "Environment",
    icon: <FaRecycle size={26} />,
  },
];

export const AMENITIES_FOR_COMMERCIAL = [
  // 🏃 Sports
  { key: "gym",
  title: "Gym",
  category: "Sports",
  icon: "/icons/amenities/Gym.svg",
},
{
  key: "swimming_pool",
  title: "Swimming Pool",
  category: "Sports",
  icon: "/icons/amenities/Swimming Pool.svg",
},

// 🏢 Convenience
{
  key: "lift",
  title: "Lift",
  category: "Convenience",
  icon: "/icons/amenities/Lift.svg",
},
{
  key: "power_backup",
  title: "Power Backup",
  category: "Convenience",
  icon: "/icons/amenities/Power Backup.svg",
},
{
  key: "visitor_parking",
  title: "Visitor Parking",
  category: "Convenience",
  icon: "/icons/amenities/Visitor Parking.svg",
},

// 🔐 Safety
{
  key: "security",
  title: "24x7 Security",
  category: "Safety",
  icon: "/icons/amenities/24x7 Security.svg",
},
{
  key: "cctv",
  title: "CCTV Surveillance",
  category: "Safety",
  icon: "/icons/amenities/CCTV Surveillance.svg",
},
{
  key: "fire_safety",
  title: "Fire Safety",
  category: "Safety",
  icon: "/icons/amenities/Fire Safety.svg",
},
{
  key: "pantry",
  title: "Pantry",
  category: "Convenience",
  icon: "/icons/amenities/Pantry.svg",
}
];

export const AMENITIES_FOR_LANDPLOTS = [
  {
    key: "garden",
    title: "Garden",
    category: "Environment",
    icon: "/icons/amenities/Garden.svg",
  },
  {
    key: "rainwater_harvesting",
    title: "Rainwater Harvesting",
    category: "Environment",
    icon: "/icons/amenities/Rainwater Harvesting.svg",
  },
  {
    key: "solar_lighting",
    title: "Solar Lighting",
    category: "Environment",
    icon: <MdWbSunny size={26} />,
  },
  {
    key: "waste_management",
    title: "Waste Management",
    category: "Environment",
    icon: <FaRecycle size={26} />,
  },
];
export const AMENITIES_FOR_AGRICULTURAL = [
    {
      key: "garden",
      title: "Garden",
      category: "Environment",
      icon: "/icons/amenities/Garden.svg",
    },
    {
      key: "rainwater_harvesting",
      title: "Rainwater Harvesting",
      category: "Environment",
      icon: "/icons/amenities/Rainwater Harvesting.svg",
    },
    {
      key: "solar_lighting",
      title: "Solar Lighting",
      category: "Environment",
      icon: <MdWbSunny size={26} />,
    },
    {
      key: "waste_management",
      title: "Waste Management",
      category: "Environment",
      icon: <FaRecycle size={26} />,
    },
    {
      key: "electricity",
      title: "Electricity",
      category: "Environment",
      icon: "/icons/amenities/Electricity.svg",
    }
]


// Backward compatible fallback used by existing screens (land + old imports)
export const AMENITIES = [...RESIDENTIAL_AMENITIES];
export const COMMERCIAL_AMENITIES = [...AMENITIES_FOR_COMMERCIAL];
export const LAND_PLOT_AMENITIES = [...AMENITIES_FOR_LANDPLOTS];
export const AGRICULTURAL_AMENITIES = [...AMENITIES_FOR_AGRICULTURAL];

export const AMENITIES_FOR_FEATURED_PROJECT = [
  { key: "swimming_pool", title: "Swimming Pool" },
  { key: "kids_pool", title: "Kids Pool" },
  { key: "gym", title: "Gym" },
  { key: "yoga_hall", title: "Yoga Hall" },
  { key: "spa", title: "Spa & Wellness Center" },
  { key: "club_house", title: "Club House" },
  { key: "mini_theatre", title: "Mini Theatre" },
  { key: "co_working", title: "Co-Working Space" },

  { key: "garden", title: "Landscaped Garden" },
  { key: "jogging_track", title: "Jogging Track" },
  { key: "open_lawn", title: "Open Lawn" },
  { key: "kids_play_area", title: "Children's Play Area" },
  { key: "basketball_court", title: "Basketball Court" },
  { key: "tennis_court", title: "Tennis Court" },

  { key: "cctv", title: "CCTV Surveillance" },
  { key: "security", title: "24x7 Security" },
  { key: "video_door_phone", title: "Video Door Phone" },
  { key: "fire_safety", title: "Fire Safety System" },

  { key: "covered_parking", title: "Covered Parking" },
  { key: "visitor_parking", title: "Visitor Parking" },
  { key: "ev_charging", title: "EV Charging Station" },
  { key: "wheelchair_access", title: "Wheelchair Access" },

  { key: "power_backup", title: "Power Backup" },
  { key: "lift", title: "High Speed Elevators" },
  { key: "water_harvesting", title: "Rain Water Harvesting" },
  { key: "solar_lighting", title: "Solar Lighting" },
];
