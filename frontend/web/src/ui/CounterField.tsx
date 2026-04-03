import { MdAdd, MdRemove } from "react-icons/md";
import { InfoIcon } from "@/icons/icons";

type CounterFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  error?: string;
  required?: boolean; // Added to match InputField capability
  tooltip?: string;
  tooltipPosition?: "start" | "center" | "end";
};

const CounterField = ({
  label,
  value,
  min = 0,
  max,
  onChange,
  error,
  required = false,
  tooltip,
  tooltipPosition = "center",
}: CounterFieldProps) => {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

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

      <div
        className={`
          flex w-full items-center justify-between rounded-md border bg-white px-3 py-[0.30rem] shadow-sm transition-colors
          ${
            error
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500"
              : "border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500"
          }
        `}
      >
        {/* Decrease Button */}
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition cursor-pointer hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MdRemove size={18} />
        </button>

        {/* Value Display - matched text-sm and color to input text */}
        <span className="text-sm font-medium text-gray-900 select-none">
          {value}
        </span>

        {/* Increase Button */}
        <button
          type="button"
          onClick={increase}
          disabled={max !== undefined && value >= max}
          className="flex h-7 w-7 items-center justify-center cursor-pointer rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MdAdd size={18} />
        </button>
      </div>

      {/* Matched error style exactly */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default CounterField;
