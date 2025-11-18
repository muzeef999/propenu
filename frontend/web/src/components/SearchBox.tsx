"use client";
import { useState, useEffect } from "react";
import { CiLocationOn } from "react-icons/ci";
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";
import Image from "next/image";
import heroBanner from "@/asserts/heroBanner.png";

const CATEGORY_OPTIONS = [
  "All Residential",
  "All Agricultural",
  "All Commercial",
  "All Land/Plot",
];

const SearchBox = () => {
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationItem[]>([]);
  const { setCity } = useCity();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }

      fetch(`/api/users/locations/search?q=${encodeURIComponent(query)}&limit=7`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(item: LocationItem) {
    setCity(item);
    setQuery(item.name);
    setResults([]);
  }

  return (
    <div className="relative w-full">
      {/* Banner */}
      <Image
        src={heroBanner}
        className="w-full h-auto"
        alt="hero sections"
        priority
      />

      {/* Search Box floating ABOVE banner */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2  w-[50%]">
        <div className="bg-white shadow-md rounded-xl border border-gray-200 p-4">

          {/* Search Row */}
          <div className="flex items-center gap-3 relative">
            <select
              className="px-3 py-2 rounded-lg text-sm bg-white cursor-pointer pr-7"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <div className="relative w-full border-l border-l-[#EBEBEB] pl-3">
              <CiLocationOn
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                type="text"
                placeholder="Search location, project, or builder..."
                className="w-full rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Dropdown List */}
          {results.length > 0 && (
            <ul className="absolute top-full mt-2 left-0 w-full bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto text-sm z-[9999]">
              {results.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="text-gray-700">{item.name}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBox;
