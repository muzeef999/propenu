import React, { useRef } from "react";
import { stripPhoneNumbersFromText } from "@/utilies/stripPhoneFromDescription";

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  maxLength?: number;
  /** Strip phones, emails, and door/house addresses as the user types / pastes */
  blockPhoneNumbers?: boolean;
  onPhoneBlocked?: () => void;
};

const TextArea = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  rows = 2,
  maxLength,
  blockPhoneNumbers = false,
  onPhoneBlocked,
}: TextAreaProps) => {
  const warnedRef = useRef(false);

  const applyValue = (next: string) => {
    if (!blockPhoneNumbers) {
      onChange(next);
      return;
    }
    const { cleaned, removed } = stripPhoneNumbersFromText(next);
    onChange(cleaned);
    if (removed) {
      if (!warnedRef.current) {
        warnedRef.current = true;
        onPhoneBlocked?.();
        window.setTimeout(() => {
          warnedRef.current = false;
        }, 1500);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative w-full">
        <textarea
          value={value}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => applyValue(e.target.value)}
          onBlur={onBlur}
          onPaste={(e) => {
            if (!blockPhoneNumbers) return;
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            const el = e.currentTarget;
            const start = el.selectionStart ?? value.length;
            const end = el.selectionEnd ?? value.length;
            const next = `${value.slice(0, start)}${pasted}${value.slice(end)}`;
            applyValue(next);
          }}
          className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"} ${maxLength ? "pb-6" : ""}`}
        />
        {maxLength && (
          <span className="absolute bottom-2 right-3 text-xs text-gray-400">
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {blockPhoneNumbers ? (
        <p className="mt-1 text-[11px] text-slate-400">
          Phone numbers, emails, and house addresses (e.g. 1-14) are not allowed
          in the description.
        </p>
      ) : null}
    </div>
  );
};

export default TextArea;
