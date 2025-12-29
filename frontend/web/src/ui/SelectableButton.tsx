"use client";

import { FiPlus, FiCheck } from "react-icons/fi";

type SelectionType = "single" | "multiple";

type SelectableButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  error?: boolean;
  selectionType?: SelectionType; // 👈 NEW
  className?: string;
};

const SelectableButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  error = false,
  selectionType = "single", // 👈 default SINGLE
  className = "",
}: SelectableButtonProps) => {
  const isMultiple = selectionType === "multiple";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        rounded-md border
        text-sm
        transition-all duration-200

        ${
          error
            ? "border-red-500 text-red-600"
            : active
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }

        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {/* ICON — ONLY FOR MULTIPLE */}
      {isMultiple && (
        <span
          className={`flex items-center justify-center w-4 h-4 rounded-full border
            ${
              active
                ? "bg-green-600 border-green-600 text-white"
                : "border-gray-400 text-gray-400"
            }
          `}
        >
          {active ? <FiCheck size={12} /> : <FiPlus size={12} />}
        </span>
      )}

      {label}
    </button>
  );
};

export default SelectableButton;
