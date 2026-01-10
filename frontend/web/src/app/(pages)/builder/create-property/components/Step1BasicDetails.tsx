'use client';

import React from 'react';
import InputField from '../../../../../ui/InputField';
import { ICreatePropertyFormState, IFeaturedProject } from '../types';

interface Step1BasicDetailsProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

export const Step1BasicDetails: React.FC<Step1BasicDetailsProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Basic Details</h2>

      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <InputField
          label="Project Title"
          value={data.title || ''}
          onChange={(v) => onUpdate('title', v)}
          placeholder="Enter project title"
          required
          error={errors.includes('Title is required') ? 'Title is required' : undefined}
        />
      </div>

      <div>
        <InputField
          label="Address"
          value={data.address || ''}
          onChange={(v) => onUpdate('address', v)}
          placeholder="Enter full address"
          required
          error={errors.includes('Address is required') ? 'Address is required' : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <InputField
            label="City"
            value={data.city || ''}
            onChange={(v) => onUpdate('city', v)}
            placeholder="City name"
            required
            error={errors.includes('City is required') ? 'City is required' : undefined}
          />
        </div>
        
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Brand Color (Optional)</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={data.color || '#000000'}
            onChange={(e) => onUpdate('color', e.target.value)}
            className="w-12 h-12 rounded cursor-pointer"
          />
          <InputField
            label="Color Hex"
            value={data.color || ''}
            onChange={(v) => onUpdate('color', v)}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
};
