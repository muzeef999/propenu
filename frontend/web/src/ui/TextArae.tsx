import React from "react";

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  maxLength?: number;
};


const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  rows = 5,
  maxLength,
}: TextAreaProps) => {
  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="inline-block text-sm font-normal m-0 p-1 bg-gray-400 text-white rounded-t-sm">
        {label} {required && "*"}
      </label>

      {/* Textarea */}
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-3 py-2 text-sm rounded-b-sm rounded-r-sm focus:outline-none focus:ring-2 focus:ring-green-500
          ${error ? "border-red-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
        `}
      />

      {/* Footer: Error + Counter */}
      <div className="flex justify-between items-center text-xs">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <span />
        )}

        {maxLength && (
          <span className="text-gray-500">
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
