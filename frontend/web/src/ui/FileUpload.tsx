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
  rejected?: RejectedUpload;
  error?: string;
};

type RejectedUpload = UploadedFile & {
  error: string;
};

const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const getExtension = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? `.${match[1]}` : "";
};

const isAcceptedFile = (file: File, accept: string) => {
  if (!accept || accept === "*/*") return true;

  const acceptedTypes = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (acceptedTypes.length === 0) return true;

  const fileType = file.type.toLowerCase();
  const fileExtension = getExtension(file.name);

  return acceptedTypes.some((acceptedType) => {
    if (acceptedType.startsWith(".")) return acceptedType === fileExtension;
    if (acceptedType.endsWith("/*")) {
      const typePrefix = acceptedType.slice(0, -1);
      return fileType.startsWith(typePrefix);
    }
    return acceptedType === fileType;
  });
};

const formatAcceptedTypes = (accept: string) => {
  const labels = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.startsWith("."))
    .map((item) => item.replace(".", "").toUpperCase());

  return labels.length > 0 ? labels.join(", ") : null;
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
  const rejectedFilesRef = useRef<RejectedUpload[]>([]);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedUpload[]>([]);
  const acceptedTypeLabel = formatAcceptedTypes(accept);

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

  const createRejectedUpload = (file: File, error: string): RejectedUpload => ({
    file,
    preview: URL.createObjectURL(file),
    source: "local",
    name: file.name,
    type: file.type,
    size: file.size,
    error,
  });

  const removeRejectedFile = (index: number) => {
    setRejectedFiles((currentFiles) => {
      const removedFile = currentFiles[index];
      if (removedFile?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removedFile.preview);
      }

      return currentFiles.filter((_, currentIndex) => currentIndex !== index);
    });
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
          if (!isAcceptedFile(file, accept)) {
            const error = `${file.name} is not supported. Upload ${
              acceptedTypeLabel || "an accepted file type"
            } only.`;

            return {
              rejected: createRejectedUpload(file, error),
              error,
            };
          }

          const maxBytes = maxSizeMB * 1024 * 1024;

          if (file.size > maxBytes) {
            const error = `More than ${maxSizeMB}MB. Upload ${maxSizeMB}MB or less.`;

            return {
              rejected: createRejectedUpload(file, error),
              error,
            };
          }

          const finalFile = await compressFile(file);

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
      const uniqueLocalErrors = Array.from(new Set(localErrors));

      const validFiles: UploadedFile[] = preparedFiles
        .map((result) => result.upload)
        .filter((file): file is UploadedFile => Boolean(file));

      const rejectedUploads: RejectedUpload[] = preparedFiles
        .map((result) => result.rejected)
        .filter((file): file is RejectedUpload => Boolean(file));

      if (uniqueLocalErrors.length > 0) {
        setLocalError(uniqueLocalErrors.join(" "));
      }

      if (rejectedUploads.length > 0) {
        setRejectedFiles((currentFiles) => [
          ...currentFiles,
          ...rejectedUploads,
        ]);
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
    rejectedFilesRef.current = rejectedFiles;
  }, [rejectedFiles]);

  useEffect(() => {
    return () => {
      previousValueRef.current.forEach((item) => {
        if (item.source === "local" && item.preview.startsWith("blob:")) {
          URL.revokeObjectURL(item.preview);
        }
      });

      rejectedFilesRef.current.forEach((item) => {
        if (item.preview.startsWith("blob:")) {
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
      {(value.length > 0 || rejectedFiles.length > 0) && (
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
              <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                {item.source === "server" ? "SERVER" : "LOCAL"}
              </span>

              <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-white">
                <p className="truncate text-[10px] font-medium">
                  {getFileLabel(item)}
                </p>
                <p className="text-[10px] text-white/80">
                  {formatBytes(item.size) ?? "Size unavailable"}
                </p>
              </div>
            </div>
          ))}

          {rejectedFiles.map((item, index) => (
            <div
              key={`${item.preview}-${index}`}
              className="relative rounded-md overflow-hidden border-2 border-red-300 bg-red-50 shadow-sm aspect-video"
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

              <div className="absolute inset-0 bg-red-500/20" />

              <button
                type="button"
                onClick={() => removeRejectedFile(index)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
              >
                X
              </button>

              <div className="absolute inset-x-0 top-1 px-2 pr-8">
                <p className="rounded bg-red-100/95 px-1.5 py-1 text-center text-[10px] font-semibold text-red-700 shadow-sm ring-1 ring-red-200">
                  {item.error}
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-red-100/95 px-2 py-1">
                <p className="text-[10px] font-semibold text-red-700">
                  {formatBytes(item.size) ?? "Size unavailable"}
                </p>
              </div>
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

        {acceptedTypeLabel && (
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: {acceptedTypeLabel}
          </p>
        )}

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
