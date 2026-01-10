"use client";

import React, { useState } from "react";
import InputField from "../../../../../ui/InputField";
import { ICreatePropertyFormState, ILogo } from "../types";
import TextArea from "@/ui/TextArae";

interface Step2HeroProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

export const Step2Hero: React.FC<Step2HeroProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  const [heroImagePreview, setHeroImagePreview] = useState<string>(
    typeof data.heroImage === "string" ? data.heroImage : ""
  );
  const [logoPreview, setLogoPreview] = useState<string>(
    data.logo?.url && typeof data.logo.url === "string" ? data.logo.url : ""
  );

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate("heroImage", file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeroImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newLogo: ILogo = { ...data.logo, url: file };
      onUpdate("logo", newLogo);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Hero Section</h2>

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
        <label className="block text-sm font-medium mb-2">Hero Image *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer hover:border-emerald-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleHeroImageChange}
            className="hidden"
            id="heroImage"
          />
          <label htmlFor="heroImage" className="cursor-pointer">
            {heroImagePreview ? (
              <img
                src={heroImagePreview}
                alt="Hero preview"
                className="w-full max-h-64 object-cover rounded-lg mb-2"
              />
            ) : (
              <div className="py-8">
                <p className="text-gray-600">Click to upload hero image</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Logo (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer hover:border-emerald-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            id="logo"
          />
          <label htmlFor="logo" className="cursor-pointer">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-32 h-32 object-contain mx-auto rounded-lg mb-2"
              />
            ) : (
              <div className="py-8">
                <p className="text-gray-600">Click to upload logo</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <div>
        <InputField
          label="Hero Tagline"
          value={data.heroTagline || ""}
          onChange={(v) => onUpdate("heroTagline", v)}
          placeholder="e.g., Luxury Living Redefined"
          required
          error={
            errors.includes("Hero tagline is required")
              ? "Hero tagline is required"
              : undefined
          }
        />
      </div>

      <div>
        <InputField
          label="Hero Sub-Tagline (Optional)"
          value={data.heroSubTagline || ""}
          onChange={(v) => onUpdate("heroSubTagline", v)}
          placeholder="Secondary tagline"
        />
      </div>

      <div>
        <TextArea
          label="Hero Description"
          value={data.heroDescription || ""}
          onChange={(value) => onUpdate("heroDescription", value)}
          placeholder="Brief description for hero section"
          rows={4}
        />
      </div>
    </div>
  );
};
