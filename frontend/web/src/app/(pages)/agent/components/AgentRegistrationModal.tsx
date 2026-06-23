"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiCamera, FiImage, FiMapPin, FiUser } from "react-icons/fi";
import { toast } from "sonner";

import { registerAgency } from "@/app/(pages)/agent/data";
import InputFiled from "@/ui/InputField";

type UploadedFile = {
  url: string;
  key: string;
};


type Props = {
  open: boolean;
  onCompleted?: () => void;
  userId: string;
  userName?: string;
};

type AgentFormState = {
  name: string;
  bio: string;
  agencyName: string;
  licenseNumber: string;
  licenseValidTill: string;
  locality: string;
  city: string;
  experienceYears: string;
  dealsClosed: string;
  areasServed: string;
  languages: string;
  coverImage?: UploadedFile;
  avatar?: UploadedFile;
  reraAgentId: string;
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

type UploadFieldProps = {
  accept?: string;
  file?: File;
  icon: React.ReactNode;
  label: string;
  previewClassName: string;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function UploadField({
  accept = "image/*",
  file,
  icon,
  label,
  previewClassName,
  required,
  onChange,
}: UploadFieldProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <label className="group block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 transition hover:border-green-500 hover:bg-green-50/50">
      <input
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={onChange}
      />

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-400">
          {previewUrl ? (
            <img src={previewUrl} alt={`${label} preview`} className={previewClassName} />
          ) : (
            icon
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
            {label}
            {required && <span className="text-red-500">*</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {file ? `${file.name} - ${formatFileSize(file.size)}` : "Click to upload image"}
          </p>
        </div>
      </div>
    </label>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AgentRegistrationModal({
  open,
  onCompleted,
  userId,
  userName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const accountName = userName?.trim() ?? "";

  const [files, setFiles] = useState<{
    avatar?: File;
    coverImage?: File;
  }>({});

  const [form, setForm] = useState<AgentFormState>({
    name: accountName,
    bio: "",
    agencyName: "",
    licenseNumber: "",
    licenseValidTill: "",
    locality: "",
    city: "",
    experienceYears: "0",
    dealsClosed: "0",
    areasServed: "",
    languages: "",
    coverImage: undefined,
    avatar: undefined,
    reraAgentId: "",
  });

  useEffect(() => {
    if (!open || !accountName) return;

    setForm((current) => {
      if (current.name.trim()) return current;
      return { ...current, name: accountName };
    });
  }, [accountName, open]);

  if (!open) return null;

  const update = <K extends keyof AgentFormState>(
    key: K,
    value: AgentFormState[K]
  ) => {
    setForm((s) => ({ ...s, [key]: value }));
  };


  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar" | "coverImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles((s) => ({ ...s, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.avatar) {
      toast.error("Avatar image is required");
      return;
    }

    if (splitCsv(form.areasServed).length === 0) {
      toast.error("Areas served is required");
      return;
    }

    setLoading(true);

    try {
      await registerAgency(
        {
          name: form.name,
          bio: form.bio,
          agencyName: form.agencyName,
          licenseNumber: form.licenseNumber,
          licenseValidTill: form.licenseValidTill,
          locality: form.locality,
          city: form.city,
          experienceYears: Number(form.experienceYears),
          dealsClosed: Number(form.dealsClosed),
          areasServed: splitCsv(form.areasServed),
          languages: splitCsv(form.languages),
          verificationStatus: "pending",
          rera: { reraAgentId: form.reraAgentId, isVerified: false },
          stats: { totalProperties: 0, publishedCount: 0 },
          user: userId,
        },
        {
          avatar: files.avatar,
          coverImage: files.coverImage,
        }
      );


      toast.success("Agent registration submitted");
      onCompleted?.();
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-registration-title"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Agent onboarding
              </p>
              <h3
                id="agent-registration-title"
                className="mt-1 text-xl font-semibold text-gray-950"
              >
                Complete your agent profile
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Add your business details so your profile can be reviewed and connected to property submissions.
              </p>
            </div>

            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Verification: pending
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-8">
                <section>
                  <SectionTitle
                    icon={<FiUser size={18} />}
                    title="Profile details"
                    subtitle="These details appear on your public agent profile after approval."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputFiled
                      label="Full name"
                      value={form.name}
                      onChange={(v) => update("name", v)}
                      required
                    />
                    <InputFiled
                      label="Agency name"
                      value={form.agencyName}
                      onChange={(v) => update("agencyName", v)}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Short bio
                    </label>
                    <textarea
                      className="min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
                      placeholder="Example: Helping families and investors find homes across Hyderabad."
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle
                    icon={<FiMapPin size={18} />}
                    title="Service location"
                    subtitle="Use the primary city and locality where you actively work."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputFiled
                      label="City"
                      value={form.city}
                      onChange={(v) => update("city", v)}
                      required
                    />
                    <InputFiled
                      label="Locality"
                      value={form.locality}
                      onChange={(v) => update("locality", v)}
                      required
                    />
                    <InputFiled
                      label="Areas served"
                      value={form.areasServed}
                      onChange={(v) => update("areasServed", v)}
                      placeholder="Madhapur, Gachibowli, Kondapur"
                      required
                    />
                    <InputFiled
                      label="Languages"
                      value={form.languages}
                      onChange={(v) => update("languages", v)}
                      placeholder="English, Hindi, Telugu"
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle
                    icon={<FiBriefcase size={18} />}
                    title="Business credentials"
                    subtitle="Add licensing and experience information for the review team."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputFiled
                      label="License number"
                      value={form.licenseNumber}
                      onChange={(v) => update("licenseNumber", v)}
                    />
                    <InputFiled
                      label="License valid till"
                      type="date"
                      value={form.licenseValidTill}
                      onChange={(v) => update("licenseValidTill", v)}
                    />
                    <InputFiled
                      label="Experience (years)"
                      type="text"
                      value={form.experienceYears}
                      onChange={(v) => update("experienceYears", onlyDigits(v))}
                    />
                    <InputFiled
                      label="Deals closed"
                      type="text"
                      value={form.dealsClosed}
                      onChange={(v) => update("dealsClosed", onlyDigits(v))}
                      required
                    />
                    <div className="md:col-span-2">
                      <InputFiled
                        label="RERA agent ID"
                        value={form.reraAgentId}
                        onChange={(v) => update("reraAgentId", v)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
                <SectionTitle
                  icon={<FiCamera size={18} />}
                  title="Profile media"
                  subtitle="Upload clear images for recognition and branding."
                />

                <UploadField
                  file={files.avatar}
                  icon={<FiCamera size={24} />}
                  label="Avatar image"
                  previewClassName="h-full w-full rounded-lg object-cover"
                  required
                  onChange={(e) => handleFileChange(e, "avatar")}
                />

                <UploadField
                  file={files.coverImage}
                  icon={<FiImage size={24} />}
                  label="Cover image"
                  previewClassName="h-full w-full object-cover"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                />

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">Review status</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your profile will be submitted as pending. Admin approval is required before it appears publicly.
                  </p>
                </div>
              </aside>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Required fields are marked with <span className="text-red-500">*</span>
            </p>
            <button
              type="submit"
              className="btn-primary rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
