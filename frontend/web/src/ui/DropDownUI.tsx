import React, { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiCheck } from 'react-icons/hi2';
import { InfoIcon } from "@/icons/icons";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  error?: string;
  tooltip?: string;
  tooltipPosition?: "start" | "center" | "end";
}

const Dropdownui: React.FC<DropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option',
  label,
  error,
  tooltip,
  tooltipPosition = "center",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const getTooltipPosition = () => {
    switch (tooltipPosition) {
      case "start":
        return "left-0";
      case "end":
        return "right-0";
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  const getArrowPosition = () => {
    switch (tooltipPosition) {
      case "start":
        return "left-3";
      case "end":
        return "right-3";
      default:
        return "left-1/2 -translate-x-1/2";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full font-poppins" ref={dropdownRef}>
      <div className="mb-2 flex items-center gap-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        {tooltip && (
          <div className="relative group">
            <InfoIcon size={16} color="#9CA3AF" />

            <div
              className={`absolute ${getTooltipPosition()} bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md min-w-[205px] max-w-[400px] whitespace-normal break-words opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}
            >
              {tooltip}

              <div
                className={`absolute ${getArrowPosition()} top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900`}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex w-full items-center justify-between rounded-lg border bg-white px-3 py-[0.40rem] shadow-sm transition-all cursor-pointer
            ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}
            ${error 
              ? 'border-red-500 ring-red-500' 
              : 'border-gray-300 hover:border-gray-400 focus:border-emerald-500 focus:ring-emerald-500'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`text-base capitalize ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <HiChevronDown 
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} 
          />
        </button>

        {isOpen && (
          <ul 
            className="absolute z-50 mt-2 max-h-60 w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black/5"
            role="listbox"
          >
            <div className="overflow-y-auto max-h-56 scrollbar-thin scrollbar-thumb-gray-200">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    className={`
                      flex cursor-pointer select-none items-center justify-between 
                      rounded-md px-3 py-2.5 text-sm transition-colors capitalize
                      ${isSelected 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.label}
                    {isSelected && <HiCheck className="h-4 w-4 text-emerald-600" />}
                  </li>
                );
              })}
            </div>
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Dropdownui;
