"use client";
import { useState, useEffect } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi"; // ✅ using react-icons
import { CiLocationOn } from "react-icons/ci";

const CATEGORY_OPTIONS = [
  "All Residential",
  "All Agricultural",
  "All Commercial",
  "All Land/Plot",
];

const SearchBox = () => {
  const [category, setCategory] = useState("All Residential");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // ✅ Debounced API Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length === 0) return setResults([]);

      fetch(`${process.env.API_URL}/api/users/locations/search?q=${encodeURIComponent(
          query
        )}&limit=7`
      )
        .then((res) => res.json())
        .then((data) => setResults(data || []));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-[50%] bg-white shadow-md rounded-xl border border-gray-200">

      {/* Top Navigation Tabs */}
      <div className="flex gap-6 px-4 py-3 text-sm text-gray-600 border-b justify-around items-center border-b-[#EBEBEB]">
        {["Buy", "Rent", "Sell", "Plots/Land", "Projects"].map((item) => (
          <button key={item} className="hover:text-primary transition">
            {item}
          </button>
        ))}
      </div>

      {/* Category Dropdown + Search */}
      <div className="flex items-center gap-3 p-4">

        {/* Category Dropdown */}
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

        {/* Search Input */}
        <div className="relative w-full border-l border-l-[#EBEBEB]">
          <CiLocationOn className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search location, project, or builder..."
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm border-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Suggestions */}
      {results.length > 0 && (
        <ul className="border-t bg-white max-h-64 overflow-y-auto text-sm">
          {results.map((item) => (
            <li
              key={item.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
