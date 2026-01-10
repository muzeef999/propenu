"use client";

import React from "react";
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

export const Step5Media: React.FC<Step5MediaProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  /* ---------------- FileUpload Change ---------------- */

  const handleFilesChange = (files: UploadedFile[]) => {
    const startOrder = (data.gallerySummary?.length || 0) + 1;

    const galleryItems: IGalleryItem[] = files.map((f, index) => ({
      url: f.file,
      order: startOrder + index,
    }));

    onUpdate("gallerySummary", galleryItems);
  };

  /* ---------------- Helpers ---------------- */

  const removeGalleryItem = (order: number) => {
    const updated = (data.gallerySummary || []).filter(
      (item) => item.order !== order
    );
    onUpdate("gallerySummary", updated);
  };

  const updateOrder = (oldOrder: number, newOrder: number) => {
    const updated = (data.gallerySummary || []).map((item) =>
      item.order === oldOrder ? { ...item, order: newOrder } : item
    );
    onUpdate("gallerySummary", updated);
  };

  const gallery = [...(data.gallerySummary || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Media & Gallery</h2>

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

      {/* File Upload */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <FileUpload
          label="Property Images"
          value={[]}
          onChange={handleFilesChange}
          accept="image/*"
          maxFiles={10}
          maxSizeMB={5}
          error={errors?.[0]}
        />
      </div>

      {/* Gallery Grid */}
      <div className="space-y-4">
        <h3 className="font-semibold">
          Gallery Images ({gallery.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gallery.map((item) => {
            const imageUrl =
              typeof item.url === "string"
                ? item.url
                : URL.createObjectURL(item.url);

            return (
              <div
                key={item.order}
                className="rounded-lg border bg-white overflow-hidden"
              >
                <img
                  src={imageUrl}
                  alt="Gallery"
                  className="h-40 w-full object-cover"
                />

                <div className="p-3 flex items-center justify-between gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.order}
                    onChange={(e) =>
                      updateOrder(item.order!, Number(e.target.value))
                    }
                    className="w-14 text-xs px-2 py-1 border rounded"
                  />

                  <button
                    onClick={() => removeGalleryItem(item.order!)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
