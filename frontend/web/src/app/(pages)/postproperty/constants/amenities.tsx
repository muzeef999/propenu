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
    key: "swimming-pool",
    title: "Swimming Pool",
    category: "Sports",
    icon: "/icons/amenities/Swimming Pool.svg",
  },
  {
    key: "jogging-track",
    title: "Jogging Track",
    category: "Sports",
    icon: "/icons/amenities/Jogging Track.svg",
  },
  {
    key: "children-play",
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
    key: "power-backup",
    title: "Power Backup",
    category: "Convenience",
    icon: "/icons/amenities/Power Backup.svg",
  },
  {
    key: "club-house",
    title: "Club House",
    category: "Convenience",
    icon: "/icons/amenities/Club House.svg",
  },
  {
    key: "visitor-parking",
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
    key: "fire-safety",
    title: "Fire Safety",
    category: "Safety",
    icon: "/icons/amenities/Fire Safety.svg",
  },
  {
    key: "video-door-phone",
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
    key: "rainwater-harvesting",
    title: "Rainwater Harvesting",
    category: "Environment",
    icon: "/icons/amenities/Rainwater Harvesting.svg",
  },
  {
    key: "solar-lighting",
    title: "Solar Lighting",
    category: "Environment",
    icon: <MdWbSunny size={26} />,
  },
  {
    key: "waste-management",
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
  key: "swimming-pool",
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
  key: "power-backup",
  title: "Power Backup",
  category: "Convenience",
  icon: "/icons/amenities/Power Backup.svg",
},
{
  key: "visitor-parking",
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
  key: "fire-safety",
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
    key: "rainwater-harvesting",
    title: "Rainwater Harvesting",
    category: "Environment",
    icon: "/icons/amenities/Rainwater Harvesting.svg",
  },
  {
    key: "solar-lighting",
    title: "Solar Lighting",
    category: "Environment",
    icon: <MdWbSunny size={26} />,
  },
  {
    key: "waste-management",
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
      key: "rainwater-harvesting",
      title: "Rainwater Harvesting",
      category: "Environment",
      icon: "/icons/amenities/Rainwater Harvesting.svg",
    },
    {
      key: "solar-lighting",
      title: "Solar Lighting",
      category: "Environment",
      icon: <MdWbSunny size={26} />,
    },
    {
      key: "waste-management",
      title: "Waste Management",
      category: "Environment",
      icon: <FaRecycle size={26} />,
    },
    {
      key: "Electricity",
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
  { key: "swimming-pool", title: "Swimming Pool" },
  { key: "kids-pool", title: "Kids Pool" },
  { key: "gym", title: "Gym" },
  { key: "yoga-hall", title: "Yoga Hall" },
  { key: "spa", title: "Spa & Wellness Center" },
  { key: "club-house", title: "Club House" },
  { key: "mini-theatre", title: "Mini Theatre" },
  { key: "co-working", title: "Co-Working Space" },

  { key: "garden", title: "Landscaped Garden" },
  { key: "jogging-track", title: "Jogging Track" },
  { key: "open-lawn", title: "Open Lawn" },
  { key: "kids-play-area", title: "Children's Play Area" },
  { key: "basketball-court", title: "Basketball Court" },
  { key: "tennis-court", title: "Tennis Court" },

  { key: "cctv", title: "CCTV Surveillance" },
  { key: "security", title: "24x7 Security" },
  { key: "video-door-phone", title: "Video Door Phone" },
  { key: "fire-safety", title: "Fire Safety System" },

  { key: "covered-parking", title: "Covered Parking" },
  { key: "visitor-parking", title: "Visitor Parking" },
  { key: "ev-charging", title: "EV Charging Station" },
  { key: "wheelchair-access", title: "Wheelchair Access" },

  { key: "power-backup", title: "Power Backup" },
  { key: "lift", title: "High Speed Elevators" },
  { key: "water-harvesting", title: "Rain Water Harvesting" },
  { key: "solar-lighting", title: "Solar Lighting" },
];
