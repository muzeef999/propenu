type CounterFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  error?: string;
};

const CounterField = ({
  label,
  value,
  min = 0,
  max,
  onChange,
  error,
}: CounterFieldProps) => {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  return (
    <div className="space-y-1">
      {/* Label – matches InputField */}
      <label className="inline-block text-sm font-normal m-0 p-1 bg-gray-400 text-white rounded-t-sm">
        &nbsp;{label}&nbsp;
      </label>

      {/* Counter Input */}
      <div
        className={`
          w-full flex items-center justify-between border px-3 py-[1px] text-sm rounded-b-sm rounded-r-sm focus-within:ring-2 focus-within:ring-green-500 ${error ? "border-red-500" : "border-gray-300"}`}
      >
        {/* Minus */}
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="w-9 h-9 flex items-center justify-center text-lg cursor-pointer disabled:opacity-40 hover:bg-gray-50 transition"> −
        </button>

        {/* Value */}
        <span className="text-base font-medium text-gray-800">
          {value}
        </span>

        {/* Plus */}
        <button
          type="button"
          onClick={increase}
          disabled={max !== undefined && value >= max}
          className=" w-9 h-9 flex items-center justify-center text-lg disabled:opacity-40 hover:bg-gray-50 transition cursor-pointer">
          +
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default CounterField;
