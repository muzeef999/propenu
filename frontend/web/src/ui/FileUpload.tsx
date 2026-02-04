import React, { useEffect, ChangeEvent, useRef } from "react";

/* ---------- Types ---------- */

export type UploadedFile = {
  file: File;
  preview: string;
};

type FileUploadProps = {
  label: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  error?: string;
};

/* ---------- Component ---------- */

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  accept = "image/*",
  maxFiles = 5,
  maxSizeMB = 5,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
   const isImage = (file: File) => file.type.startsWith("image/");
    const isPDF = (file: File) => file.type === "application/pdf";

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const remainingSlots = maxFiles - value.length;
   


    const validFiles: UploadedFile[] = selectedFiles
      .slice(0, remainingSlots)
      .filter((file) => file.size <= maxSizeMB * 1024 * 1024)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    onChange([...value, ...validFiles]);
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      value.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [value]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          {value.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-md overflow-hidden border border-gray-200 shadow-sm aspect-video"
            >
              {isImage(item.file) ? (
                <img
                  src={item.preview}
                  alt={`preview-${index}`}
                  className="h-full w-full object-cover"
                />
              ) : isPDF(item.file) ? (
                <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 text-gray-700">
                  <svg
                    className="w-10 h-10 text-red-500 mb-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2a5 5 0 00-5 5v10a5 5 0 005 5h5a5 5 0 005-5V9l-7-7h-3z" />
                  </svg>
                  <p className="text-xs text-center px-2 truncate">
                    {item.file.name}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-100 text-xs">
                  File
                </div>
              )}


              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-md p-6
          flex flex-col items-center justify-center
          text-center cursor-pointer transition-colors
          ${error ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-green-500 hover:bg-gray-50"}
        `}
      >
        <svg
          className="w-8 h-8 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-8m0 0l-3 3m3-3l3 3M20 16.5a4.5 4.5 0 00-3.5-4.4"
          />
        </svg>

        <p className="text-sm font-medium text-gray-700">
          Click to upload or drag and drop
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Max {maxFiles} images • Up to {maxSizeMB}MB each
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FileUpload;
