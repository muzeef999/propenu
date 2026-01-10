"use client";

import React, { useState } from "react";
import { IAboutSummary, ICreatePropertyFormState } from "../types";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import TextArea from "@/ui/TextArae";

interface Step6AboutProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

export const Step6About: React.FC<Step6AboutProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  const [newAbout, setNewAbout] = useState<IAboutSummary>({
    aboutDescription: "",
    rightContent: "",
    url: undefined,
  });

  const [aboutImage, setAboutImage] = useState<UploadedFile[]>([]);

  /* ---------------- Save About ---------------- */

  const saveAbout = () => {
    if (!newAbout.rightContent.trim()) return;

    onUpdate("aboutSummary", [
      {
        ...newAbout,
        url: aboutImage[0]?.file,
      },
    ]);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">About Section</h2>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <ul className="space-y-1 text-sm text-red-700">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* About Form */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
        <h3 className="text-lg font-semibold">About Content</h3>

        {/* Image Upload */}
        <FileUpload
          label="About Image"
          value={aboutImage}
          onChange={(files) => setAboutImage(files.slice(0, 1))}
          accept="image/*"
          maxFiles={1}
          maxSizeMB={5}
        />

        {/* Description */}
        <TextArea
          label="Description (Optional)"
          value={newAbout.aboutDescription || ""}
          placeholder="Brief description about the project"
          rows={3}
          onChange={(value) =>
            setNewAbout({
              ...newAbout,
              aboutDescription: value,
            })
          }
        />

        {/* Content */}
        <TextArea
          label="Content"
          required
          value={newAbout.rightContent || ""}
          placeholder="Detailed about content"
          rows={5}
          onChange={(value) =>
            setNewAbout({
              ...newAbout,
              rightContent: value,
            })
          }
        />

        <button
          onClick={saveAbout}
          disabled={!newAbout.rightContent.trim()}
          className="w-full rounded-lg bg-emerald-600 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          Save About Section
        </button>
      </div>
    </div>
  );
};
