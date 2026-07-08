"use client";

import { FiCheck, FiPlus } from "react-icons/fi";

type SelectionType = "single" | "multiple";

type SelectableButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  error?: boolean;
  selectionType?: SelectionType;
  showIndicator?: boolean;
  className?: string;
};

const SelectableButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  error = false,
  selectionType = "single",
  showIndicator = false,
  className = "",
}: SelectableButtonProps) => {
  const showSelectionIndicator =
    selectionType === "multiple" || showIndicator;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-all duration-200 cursor-pointer
        ${error ? "border-red-500 text-red-600" : active ? "border-green-600 bg-green-50 text-green-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}
        ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}
      `}
    >
      {showSelectionIndicator && (
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            active
              ? "border-green-600 bg-green-600 text-white"
              : "border-gray-400 text-gray-400"
          }`}
        >
          {active ? <FiCheck size={12} /> : <FiPlus size={12} />}
        </span>
      )}

      {label}
    </button>
  );
};

export default SelectableButton;
