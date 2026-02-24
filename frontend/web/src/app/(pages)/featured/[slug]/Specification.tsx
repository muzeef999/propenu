"use client";

import { useState } from "react";
import {
  FaBuilding,
  FaBorderAll,
  FaUtensils,
  FaBath,
  FaBolt,
  FaDoorOpen,
} from "react-icons/fa";

type SpecItem = {
  title: string;
  description: string;
};

type SpecificationType = {
  category: string;
  items: SpecItem[];
  order?: number;
};

type Props = {
  specifications: {
    specifications?: SpecificationType[];
    color?: string;
  };
};

/* 👉 Icon Map per Category */
const ICONS: Record<string, any> = {
  Structure: FaBuilding,
  Flooring: FaBorderAll,
  Kitchen: FaUtensils,
  Bathrooms: FaBath,
  Electrical: FaBolt,
  "Doors & Windows": FaDoorOpen,
};

const Specification = ({ specifications }: Props) => {
  const specs = specifications?.specifications || [];
  const color = specifications?.color || "#16a34a";

  if (!specs.length) return null;

  const sorted = [...specs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [active, setActive] = useState(sorted[0].category);

  const activeSpec = sorted.find((s) => s.category === active) || sorted[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* HEADER */}
      <div className="mb-6 flex items-start justify-between gap-6">
        <div style={{ color: color, borderLeft: `5px solid ${color}` }}>
          <div className="ml-2">
            <h1 className="text-2xl font-bold">Specifications</h1>
            <p className="headingDesc">Building excellence in Hyderabad</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-gray-500 pb-2 overflow-auto">
        {sorted.map((s) => {
          const Icon = ICONS[s.category] || FaBuilding;

          return (
            <button
              key={s.category}
              onClick={() => setActive(s.category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap transition
                ${
                  active === s.category
                    ? "text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              style={active === s.category ? { backgroundColor: color } : {}}
            >
              <Icon />
              {s.category}
            </button>
          );
        })}
      </div>

      <br />
      {/* CONTENT GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeSpec.items.map((item, i) => (
          <div
            key={i}
            className="p-5  bg-white shadow-sm rounded-md hover:shadow-md transition"
          >
            <p className="font-semibold text-gray-800">{item.title}</p>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Specification;
