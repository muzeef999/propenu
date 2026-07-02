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

  const sorted = [...specs]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((spec, index) => ({
      ...spec,
      key: `${spec.category}-${spec.order ?? "na"}-${index}`,
    }));

  const [activeKey, setActiveKey] = useState(sorted[0].key);

  const activeSpec = sorted.find((s) => s.key === activeKey) || sorted[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* HEADER */}
      <div className="mb-6 flex items-start justify-bet ween gap-6">
        <div style={{ color: color, borderLeft: `5px solid ${color}` }}>
          <div className="ml-2">
            <h1 className="text-[20px] font-bold lg:text-2xl md:text-4xl">
              Specifications
            </h1>
            <p className="headingDesc text-xs lg:text-base md:text-lg">
              Key details of the property
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-gray-500 pb-2 overflow-auto">
        {sorted.map((s) => {
          const Icon = ICONS[s.category] || FaBuilding;

          return (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm whitespace-nowrap transition
                ${activeKey === s.key
                  ? "text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              style={activeKey === s.key ? { backgroundColor: color } : {}}
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
