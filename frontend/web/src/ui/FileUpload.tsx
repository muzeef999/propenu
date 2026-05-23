import React, { useEffect, ChangeEvent, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

/* ======================================================
   TYPES
====================================================== */

export type UploadedFile = {
  file?: File; // only for local uploads
  preview: string; // blob url OR server url
  source: "local" | "server";
  name?: string;
  type?: string;
  size?: number;
};

type FileUploadProps = {
  label: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onRemove?: (
    file: UploadedFile,
    index: number,
    currentFiles: UploadedFile[],
  ) => Promise<boolean | void> | boolean | void;
  accept?: string;
  minFiles?: number;
  maxFiles?: number;
  maxSizeMB?: number;
  error?: string;
};

type PreparedUpload = {
  upload?: UploadedFile;
  error?: string;
};

/* ======================================================
   COMPONENT
====================================================== */

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  onRemove,
  accept = "*/*",
  minFiles = 0,
  maxFiles = 5,
  maxSizeMB = 5,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousValueRef = useRef<UploadedFile[]>(value);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const imageExtensionPattern =
    /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;

  const isImage = (item: UploadedFile) => {
    if (item.file?.type) return item.file.type.startsWith("image/");
    if (item.type) return item.type.startsWith("image/");
    return (
      imageExtensionPattern.test(item.preview) ||
      imageExtensionPattern.test(item.name || "")
    );
  };

  const getFileLabel = (item: UploadedFile) => {
    if (item.name) return item.name;

    try {
      const pathname = new URL(item.preview).pathname;
      const filename = pathname.split("/").filter(Boolean).pop();
      return filename || "File";
    } catch {
      return "File";
    }
  };

  const compressFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return file;

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
      });

      return new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error("Compression failed", error);
      return file;
    }
  };

  /* ---------- Handle file select ---------- */
  const handleSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setLocalError(null);

    const selectedFiles = Array.from(e.target.files);
    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      setLocalError(`You can upload up to ${maxFiles} files.`);
      e.target.value = "";
      return;
    }

    const limitedFiles = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      setLocalError(
        `Only ${remainingSlots} more ${
          remainingSlots === 1 ? "file" : "files"
        } can be uploaded.`,
      );
    }

    try {
      const preparedFiles = await Promise.all(
        limitedFiles.map(async (file): Promise<PreparedUpload> => {
          const finalFile = await compressFile(file);
          const maxBytes = maxSizeMB * 1024 * 1024;

          if (finalFile.size > maxBytes) {
            const compressedText = file.type.startsWith("image/")
              ? " after compression"
              : "";
            return {
              error: `${file.name} is larger than ${maxSizeMB}MB${compressedText}.`,
            };
          }

          return {
            upload: {
              file: finalFile,
              preview: URL.createObjectURL(finalFile),
              source: "local" as const,
              name: finalFile.name,
              type: finalFile.type,
              size: finalFile.size,
            },
          };
        }),
      );

      const localErrors = preparedFiles
        .map((result) => result.error)
        .filter((message): message is string => Boolean(message));

      const validFiles: UploadedFile[] = preparedFiles
        .map((result) => result.upload)
        .filter((file): file is UploadedFile => Boolean(file));

      if (localErrors.length > 0) {
        setLocalError(localErrors.join(" "));
      }

      if (validFiles.length > 0) {
        onChange([...value, ...validFiles].slice(0, maxFiles));
      }
    } finally {
      e.target.value = "";
    }
  };

  /* ---------- Cleanup blob URLs ---------- */
  useEffect(() => {
    previousValueRef.current.forEach((item) => {
      const stillExists = value.some(
        (currentItem) => currentItem.preview === item.preview,
      );

      if (
        !stillExists &&
        item.source === "local" &&
        item.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(item.preview);
      }
    });

    previousValueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      previousValueRef.current.forEach((item) => {
        if (item.source === "local" && item.preview.startsWith("blob:")) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* ---------- Preview Grid ---------- */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          {value.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-md overflow-hidden border border-gray-200 shadow-sm aspect-video"
            >
              {isImage(item) ? (
                <img
                  src={item.preview}
                  alt={getFileLabel(item)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 px-2 text-center text-xs text-gray-600">
                  <span className="font-medium text-gray-700">File</span>
                  <span className="max-w-full truncate">
                    {getFileLabel(item)}
                  </span>
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                disabled={removingIndex === index}
                onClick={async () => {
                  try {
                    setRemovingIndex(index);
                    const allowRemove = await onRemove?.(item, index, value);
                    if (allowRemove === false) return;
                    onChange(value.filter((_, i) => i !== index));
                  } finally {
                    setRemovingIndex(null);
                  }
                }}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
              >
                X
              </button>

              {/* Badge */}
              <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                {item.source === "server" ? "SERVER" : "LOCAL"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Upload Area ---------- */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-md p-6
          flex flex-col items-center justify-center
          text-center cursor-pointer transition-colors
          ${
            error
              ? "border-red-500 bg-red-50"
              : value.length >= maxFiles
                ? "border-gray-300 bg-gray-50"
                : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
          }
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
          {minFiles > 0
            ? `Min ${minFiles} and max ${maxFiles}`
            : `Max ${maxFiles}`}{" "}
          {maxFiles === 1 ? "file" : "files"} • Up to {maxSizeMB}MB each
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {value.length}/{maxFiles} selected
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {(error || localError) && (
        <p className="mt-1 text-xs text-red-500">{error || localError}</p>
      )}
    </div>
  );
};

export default FileUpload;
