import React from "react";
import { InfoIcon } from "@/icons/icons";

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email" | "date" | "tel";
  required?: boolean;
  disabled?: boolean;
  error?: string;
  tooltip?: string;
  tooltipPosition?: "start" | "center" | "end"; // ✅ ADD THIS
};


const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  error,
  tooltip,
  tooltipPosition = "center", // default
}: InputFieldProps) => {

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
      <div className="flex items-center gap-1 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${error ? "border-red-500" : "border-gray-300"
          } ${disabled ? "cursor-not-allowed text-gray-500" : "bg-white"}`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default InputField;
