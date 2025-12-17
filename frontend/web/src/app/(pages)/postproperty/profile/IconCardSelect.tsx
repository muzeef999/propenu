type Option = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

type IconCardSelectProps = {
  label: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
};

const IconCardSelect = ({
  label,
  value,
  options,
  onChange,
  error,
}: IconCardSelectProps) => {
  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="inline-block text-sm font-normal m-0 p-1 bg-gray-400 text-white rounded-t-sm">
        {label}
      </label>

      {/* Cards */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border rounded-b-sm rounded-r-sm
          ${error ? "border-red-500" : "border-gray-300"}
        `}
      >
        {options.map((opt) => {
          const active = value === opt.key;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border text-sm transition
                ${
                  active
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-400"
                }
              `}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="font-medium text-center">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default IconCardSelect;
