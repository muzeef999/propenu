import React, { useId } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { InfoIcon } from "@/icons/icons";

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
  tooltip?: string;
  tooltipPosition?: "start" | "center" | "end";
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
  tooltip,
  tooltipPosition = "center",
}) => {
  const inputId = useId();

  const getTooltipPosition = () => {
    switch (tooltipPosition) {
      case "start":
        return "left-0";
      case "end":
        return "right-0";
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  const getArrowPosition = () => {
    switch (tooltipPosition) {
      case "start":
        return "left-3";
      case "end":
        return "right-3";
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {tooltip && (
          <div className="relative group">
            <InfoIcon size={16} color="#9CA3AF" />

            <div
              className={`absolute ${getTooltipPosition()} bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md min-w-[205px] max-w-[400px] whitespace-normal break-words opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}
            >
              {tooltip}

              <div
                className={`absolute ${getArrowPosition()} top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900`}
              ></div>
            </div>
          </div>
        )}
      </div>

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
          className={`w-full px-3 py-2 text-sm outline-none bg-transparentplaceholder:text-gray-400[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${disabled ? "text-gray-500" : "text-gray-900"}`}
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
            className={`h-full appearance-none bg-transparent py-2 pl-1 pr-2 text-sm font-medium outline-none
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
