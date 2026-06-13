"use client";

import React, { useState } from "react";
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


export default function AgentRegistrationModal({
  open,
  onCompleted,
  userId,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<{
    avatar?: File;
    coverImage?: File;
  }>({});

  const [form, setForm] = useState<AgentFormState>({
    name: "",
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
          areasServed: form.areasServed.split(","),
          languages: form.languages.split(","),
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
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-xl">
        <h3
          id="agent-registration-title"
          className="text-lg font-semibold text-gray-800"
        >
          Complete Agent Registration
        </h3>
        <p className="mt-1 text-sm text-gray-500 mb-6">
          To access your agent dashboard, please provide these additional
          details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
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
              type="number"
              value={form.experienceYears}
              onChange={(v) => update("experienceYears", v)}
            />
            <InputFiled
              label="Deals closed"
              type="number"
              value={form.dealsClosed}
              onChange={(v) => update("dealsClosed", v)}
              required
            />
            <InputFiled
              label="Areas served (comma-separated)"
              value={form.areasServed}
              onChange={(v) => update("areasServed", v)}
            />
            <InputFiled
              label="Languages (comma-separated)"
              value={form.languages}
              onChange={(v) => update("languages", v)}
            />
            <InputFiled
              label="RERA agent ID"
              value={form.reraAgentId}
              onChange={(v) => update("reraAgentId", v)}
            />
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar Image <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {files.avatar && (
                  <img
                    src={URL.createObjectURL(files.avatar)}
                    alt="Avatar Preview"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}


                <input
                  type="file"
                  accept="image/*"
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  onChange={(e) => handleFileChange(e, "avatar")}
                />
              </div>
            </div>
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>
              <div className="flex items-center gap-2">
                {files.coverImage && (
  <img
    src={URL.createObjectURL(files.coverImage)}
    alt="Cover Preview"
    className="w-10 h-10 rounded-md object-cover"
  />
)}


                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                />
              </div>
            </div>
          </div>

          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            placeholder="Short bio"
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
          />

          <div className="flex justify-end pt-2">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Complete & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
