"use client";

import React, { useState } from "react";
import { ICreatePropertyFormState, IGalleryItem } from "../types";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";

interface Step5MediaProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

const GALLERY_CATEGORIES = [
  "Interior",
  "Exterior",
  "Amenities",
  "Floor Plan",
  "Landscape",
  "Other",
];

export const Step5Media: React.FC<Step5MediaProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Interior");

  const saveGallery = () => {
    if (files.length === 0) return;

    const startOrder = data.gallerySummary?.length ?? 0;

    const newItems: IGalleryItem[] = files.map((f, index) => ({
      url: f.file, // 🔥 File object (important)
      title: title || undefined,
      category,
      order: startOrder + index + 1,
    }));

    onUpdate("gallerySummary", [
      ...(data.gallerySummary || []),
      ...newItems,
    ]);

    // reset local state
    setFiles([]);
    setTitle("");
    setCategory("Interior");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Media & Gallery</h2>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside text-red-700">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload */}
      <div className="rounded-xl border border-emerald-200 bg-[#ebfcf4] p-6 space-y-4">
        <h3 className="text-lg font-semibold">Upload Gallery Images</h3>

        <FileUpload
          label="Gallery Images"
          value={files}
          onChange={setFiles}
          accept="image/*"
          maxFiles={10}
          maxSizeMB={10}
        />

        <div className="grid grid-cols-1 gap-4">
    

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={saveGallery}
          disabled={files.length === 0}
          className="w-full btn-primary text-white py-2 rounded-lg disabled:opacity-50"
        >
          Add to Gallery
        </button>
      </div>
    </div>
  );
};
