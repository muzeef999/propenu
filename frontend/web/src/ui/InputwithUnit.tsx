import React, { useId } from "react";
import { IoIosArrowDown } from "react-icons/io";

type UnitOption = {
  label: string;
  value: string;
};

interface InputWithUnitProps {
  label: string;
  value: string | number;
  unit: string | null;
    units: { label: string; value: string }[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const InputWithUnit: React.FC<InputWithUnitProps> = ({
  label,
  value,
  unit,
  units,
  placeholder = "0.00",
  onValueChange,
  onUnitChange,
  required = false,
  disabled = false,
  error,
}) => {
  const inputId = useId();

  return (
    <div className="w-full">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {/* Input wrapper */}
      <div
        className={`
          flex items-stretch overflow-hidden rounded-md border shadow-sm
          transition-colors
          focus-within:ring-2
          ${
            error
              ? "border-red-500 focus-within:ring-red-500"
              : "border-gray-300 focus-within:border-green-500 focus-within:ring-green-500"
          }
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
        `}
      >
        {/* Number Input */}
        <input
          id={inputId}
          type="number"
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          className={`
            w-full px-3 py-2 text-sm outline-none bg-transparent
            placeholder:text-gray-400
            [appearance:textfield]
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none
            ${disabled ? "text-gray-500" : "text-gray-900"}
          `}
        />

        {/* Divider */}
        <div className="my-2 w-px bg-gray-200" />

        {/* Unit Select */}
        <div className="relative flex items-center">
          <select
            value={unit || ""}
            disabled={disabled}
            onChange={(e) => onUnitChange(e.target.value)}
            aria-label={`Unit for ${label}`}
            className={`
              h-full appearance-none bg-transparent
              py-2 pl-1 pr-8 text-sm font-medium outline-none
              ${
                disabled
                  ? "cursor-not-allowed text-gray-500"
                  : "cursor-pointer text-gray-700"
              }
            `}
          >
            {units.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>

          {/* Dropdown Icon */}
          <div className="pointer-events-none absolute right-2.5 text-gray-500">
            <IoIosArrowDown size={16} />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default InputWithUnit;
