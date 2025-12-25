import { MdAdd, MdRemove } from "react-icons/md";

type CounterFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  error?: string;
  required?: boolean; // Added to match InputField capability
};

const CounterField = ({
  label,
  value,
  min = 0,
  max,
  onChange,
  error,
  required = false,
}: CounterFieldProps) => {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  return (
    <div className="w-full">
      {/* Matched label style exactly with InputField */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

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
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
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
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
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