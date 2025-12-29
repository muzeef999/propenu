"use client";
import React from "react";

type SelectableButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
};

const SelectableButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  error = false,
  className = "",
}: SelectableButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        px-6 py-2
        border rounded-md
        text-sm
        shadow-sm
        transition-colors duration-200

        ${
          error
            ? "border-red-500 focus:ring-red-500 text-red-600"
            : active
            ? "border-green-500 bg-green-50 text-green-600 "
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }

        ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : ""
        }

        ${className}
      `}
    >
      {label}
    </button>
  );
};

export default SelectableButton;
