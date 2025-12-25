import React, { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiCheck } from 'react-icons/hi2';

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
}

const Dropdownui: React.FC<DropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option',
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex w-full items-center justify-between rounded-lg border bg-white px-3 py-[0.40rem] shadow-sm transition-all
            ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}
            ${error 
              ? 'border-red-500 ring-red-500' 
              : 'border-gray-300 hover:border-gray-400 focus:border-emerald-500 focus:ring-emerald-500'
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`text-base ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
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
                      rounded-md px-3 py-2.5 text-sm transition-colors
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