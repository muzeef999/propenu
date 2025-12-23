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
  rows = 2,
  maxLength,
}: TextAreaProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"}`}
      />
      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">{error && <p className="text-xs text-red-500">{error}</p>}</div>
        {maxLength && (
          <span className="text-xs text-gray-400 ml-2">
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
