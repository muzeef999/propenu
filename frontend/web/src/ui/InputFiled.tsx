import React from "react";

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email";
  required?: boolean;
  disabled?: boolean;
  error?: string;
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
}: InputFieldProps) => {
  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="inline-block text-sm font-normal  m-0 p-1 bg-gray-400 text-white rounded-t-sm">{label}</label>
      {/* Input */}
      <input  type={type} value={value} disabled={disabled}  placeholder={placeholder}  onChange={(e) => onChange(e.target.value)}
        className={`w-full  border px-3 py-2 text-sm rounded-b-sm rounded-r-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${error ? "border-red-500" : "border-gray-300"} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default InputField;
