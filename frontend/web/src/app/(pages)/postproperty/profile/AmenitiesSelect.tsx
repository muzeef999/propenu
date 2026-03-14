import { IAmenity } from "@/types/residential";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FiX } from "react-icons/fi";

type AmenitiesSelectProps = {
  label?: string;
  value: IAmenity[];
  options: IAmenity[];
  onChange: (value: IAmenity[]) => void;
  error?: string;
};

const toSerializableAmenity = (item: IAmenity): IAmenity => ({
  key: item.key,
  title: item.title,
  category: item.category,
  description: item.description,
});

const AmenitiesSelect = ({
  label = "Amenities",
  value,
  options,
  onChange,
  error,
}: AmenitiesSelectProps) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedAmenities = useMemo(
    () =>
      options.reduce(
        (acc, item) => {
          const category = item.category || "Other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        },
        {} as Record<string, IAmenity[]>,
      ),
    [options],
  );

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    const hasNonSerializableIcon = value.some(
      (item) => item.icon && typeof item.icon !== "string",
    );

    if (!hasNonSerializableIcon) return;

    onChange(value.map(toSerializableAmenity));
  }, [onChange, value]);

  const toggleAmenity = (amenity: IAmenity) => {
    const serializableValue = value.map(toSerializableAmenity);
    const exists = serializableValue.some((a) => a.key === amenity.key);

    if (exists) {
      onChange(serializableValue.filter((a) => a.key !== amenity.key));
    } else {
      onChange([...serializableValue, toSerializableAmenity(amenity)]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-md font-medium text-gray-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full min-h-[52px] border border-dashed px-3 py-2 rounded-md cursor-pointer bg-white text-left
          ${error ? "border-red-500" : "border-gray-300"}
        `}
      >
        {value.length === 0 ? (
          <span className="text-sm text-gray-400">
            Select amenities
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {value.map((amenity) => (
              <span
                key={amenity.key}
                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full"
              >
                {amenity.title}
              </span>
            ))}
            <span className="ml-auto text-xs text-gray-500">
              {value.length} selected
            </span>
          </div>
        )}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-3 sm:p-6"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Select amenities"
              className="mx-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(90vh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
                <div className="flex items-center justify-between pb-4 sm:pb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Add property amenities
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {value.length} selected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-10 w-10 rounded-full bg-gray-100 text-2xl leading-none text-gray-500 transition hover:bg-gray-200 cursor-pointer"
                    aria-label="Close amenities dialog"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="space-y-8">
                  {Object.entries(groupedAmenities).map(([category, items]) => (
                    <section key={category}>
                      <h4 className="mb-4 font-semibold text-gray-800">
                        {category}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {items.map((amenity) => {
                          const checked = value.some(
                            (a) => a.key === amenity.key,
                          );

                          return (
                            <button
                              key={amenity.key}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className={`w-24 h-24 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border ${checked
                                  ? "border-green-600 bg-green-50"
                                  : "border-gray-300 bg-white hover:bg-gray-50"
                                }
  `}
                            >
                              <div className="mb-2 flex justify-center">
                                {typeof amenity.icon === "string" ? (
                                  <Image
                                    src={amenity.icon.trim()}
                                    alt={amenity.title}
                                    width={24}
                                    height={24}
                                    className={`h-6 w-6 transition-all duration-200 ${checked ? "filter brightness-0 saturate-400 invert-36 sepia-84 hue-rotate-95" : "filter brightness-0 opacity-50"}`}
                                  />
                                ) : amenity.icon ? (
                                  <span className="text-gray-600 [&>svg]:h-6 [&>svg]:w-6">
                                    {amenity.icon}
                                  </span>
                                ) : null}
                              </div>

                              <p
                                className={`text-xs font-medium ${checked ? "text-green-700" : "text-gray-700"
                                  }`}
                              >
                                {amenity.title}
                              </p>
                            </button>


                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default AmenitiesSelect;
