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
    icon: "./icons/amenities/toilet.svg",
  },
  {
    key: "swimming-pool",
    title: "Swimming Pool",
    category: "Sports",
    icon: <FaSwimmingPool size={26} />,
  },
  {
    key: "jogging-track",
    title: "Jogging Track",
    category: "Sports",
    icon: <FaRunning size={26} />,
  },
  {
    key: "children-play",
    title: "Children's Play Area",
    category: "Sports",
    icon: <FaChild size={26} />,
  },

  // 🏢 Convenience
  {
    key: "lift",
    title: "Lift",
    category: "Convenience",
    icon: <MdElevator size={26} />,
  },
  {
    key: "power-backup",
    title: "Power Backup",
    category: "Convenience",
    icon: <MdPower size={26} />,
  },
  {
    key: "club-house",
    title: "Club House",
    category: "Convenience",
    icon: <BsHouseDoor size={26} />,
  },
  {
    key: "visitor-parking",
    title: "Visitor Parking",
    category: "Convenience",
    icon: <FaCar size={26} />,
  },

  // 🔐 Safety
  {
    key: "security",
    title: "24x7 Security",
    category: "Safety",
    icon: <FaShieldAlt size={26} />,
  },
  {
    key: "cctv",
    title: "CCTV Surveillance",
    category: "Safety",
    icon: <GiCctvCamera size={26} />,
  },
  {
    key: "fire-safety",
    title: "Fire Safety",
    category: "Safety",
    icon: <FaFireExtinguisher size={26} />,
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
    icon: <MdNature size={26} />,
  },
  {
    key: "rainwater-harvesting",
    title: "Rainwater Harvesting",
    category: "Environment",
    icon: <FaLeaf size={26} />,
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


// Backward compatible fallback used by existing screens (land + old imports)
export const AMENITIES = [...RESIDENTIAL_AMENITIES];
export const COMMERCIAL_AMENITIES = [...RESIDENTIAL_AMENITIES];

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
