// components/tabs/MediaTab.tsx
"use client";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";

type BasicTabProps = {
  onNext: () => void; // 👈 receives the prop
  onBack: () => void;
  setImageFiles: (f: File[]) => void;
  setVideoFiles: (f: File[]) => void;
};

export default function MediaTab({
  setImageFiles,
  setVideoFiles,
  onNext,
  onBack,
}: BasicTabProps ) {
  const { register } = useFormContext();
  const [previews, setPreviews] = useState<string[]>([]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setVideoFiles(files);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div>
        <div className="flex  pt-4">
          <button type="button" onClick={onBack} className="btn btn-primary">
            Back
          </button>
        </div>
        <h1>Add photos & videos</h1>
        <div>
          <label>Upload images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <div className="flex gap-2 mt-2">
            {previews.map((p, i) => (
              <img key={i} src={p} className="w-24 h-16 object-cover rounded" />
            ))}
          </div>

          <label className="mt-4">Upload videos</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
          />
        </div>
        {/* ✅ NEXT button at bottom */}
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onNext} className="btn btn-primary">
            Continue →
          </button>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-center">
        <h1>Knowleadge guide details propority</h1>
      </div>
    </div>
  );
}
