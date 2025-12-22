import { IAmenity } from "@/types/residential";
import { useEffect, useRef, useState } from "react";

type AmenitiesSelectProps = {
  label?: string;
  value: IAmenity[];
  options: IAmenity[];
  onChange: (value: IAmenity[]) => void;
  error?: string;
};

const AmenitiesSelect = ({
  label = "Amenities",
  value,
  options,
  onChange,
  error,
}: AmenitiesSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAmenity = (amenity: IAmenity) => {
    const exists = value.some((a) => a.key === amenity.key);

    if (exists) {
      onChange(value.filter((a) => a.key !== amenity.key));
    } else {
      onChange([...value, amenity]);
    }
  };

  return (
    <div ref={ref} className="space-y-1">
      {/* Label */}
      <label className="inline-block text-sm font-normal m-0 p-1 bg-gray-400 text-white rounded-t-sm">
        {label}
      </label>

      {/* Input box (same style as image upload) */}
      <div
        onClick={() => setOpen(!open)}
        className={`w-full min-h-[52px] border border-dashed px-3 py-2 rounded-b-sm rounded-r-sm cursor-pointer bg-white
          ${error ? "border-red-500" : "border-gray-300"}
        `}
      >
        {value.length === 0 ? (
          <span className="text-sm text-gray-400">
            Select amenities
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((amenity, idx) => (
                  <span
                    key={amenity.key ?? amenity.title ?? `selected-${idx}`}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
                  >
                    {amenity.title}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAmenity(amenity);
                      }}
                      className="text-green-700 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </span>
                ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="border rounded-md bg-white p-3 grid grid-cols-2 md:grid-cols-3 gap-3 shadow-sm">
          {options.map((amenity, idx) => {
            const checked = value.some(
              (a) => a.key === amenity.key
            );

            return (
              <label
                key={amenity.key ?? amenity.title ?? `opt-${idx}`}
                className={`flex items-center gap-2 text-sm cursor-pointer border rounded px-2 py-1
                  ${
                    checked
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(amenity)}
                  className="accent-green-600"
                />
                <span>{amenity.title}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default AmenitiesSelect;
