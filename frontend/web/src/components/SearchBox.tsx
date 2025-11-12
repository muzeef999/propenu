// components/SearchBox.tsx
"use client";
import { useState, useEffect } from "react";
import { CiLocationOn } from "react-icons/ci";
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";

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

      fetch(
        `/api/users/locations/search?q=${encodeURIComponent(query)}&limit=7`
      )
        .then((res) => res.json())
        .then((data) => setResults(data || []))
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
    <div className="w-[50%] bg-white shadow-md rounded-xl border border-gray-200">
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          <select
            className="px-3 py-2 rounded-lg text-sm bg-white cursor-pointer pr-7"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full border-l border-l-[#EBEBEB]">
          <CiLocationOn
            className="absolute left-3 top-3 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search location, project, or builder..."
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm border-none outline-none focus:ring-0 focus:border-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {results.length > 0 && (
        <ul className="border-t bg-white max-h-64 overflow-y-auto text-sm">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.city ? `${item.city}` : ""}
                  {item.state ? `, ${item.state}` : ""}{" "}
                  {item.country ? `, ${item.country}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
