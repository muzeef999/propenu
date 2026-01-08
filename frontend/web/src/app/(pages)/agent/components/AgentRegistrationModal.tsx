"use client";

import React, { useState } from "react";
import { toast } from "sonner";

import { registerAgency } from "@/app/(pages)/agent/data";
import InputFiled from "@/ui/InputField";

async function uploadFile(file: File): Promise<string> {
  console.log(`Uploading ${file.name}...`);

  return new Promise((resolve) => {
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      resolve(url);
    }, 1000);
  });
}

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
  city: string;
  experienceYears: string;
  dealsClosed: string;
  areasServed: string;
  languages: string;
  coverImage: string;
  avatar: string;
  reraAgentId: string;
};

export default function AgentRegistrationModal({
  open,
  onCompleted,
  userId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({
    avatar: false,
    coverImage: false,
  });

  const [form, setForm] = useState<AgentFormState>({
    name: "",
    bio: "",
    agencyName: "",
    licenseNumber: "",
    licenseValidTill: "",
    city: "",
    experienceYears: "0",
    dealsClosed: "0",
    areasServed: "",
    languages: "",
    coverImage: "",
    avatar: "",
    reraAgentId: "",
  });

  if (!open) return null;

  const update = (key: keyof AgentFormState, value: string) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar" | "coverImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((s) => ({ ...s, [field]: true }));
    try {
      const url = await uploadFile(file);
      update(field, url);
      toast.success(
        `${
          field === "avatar" ? "Avatar" : "Cover image"
        } uploaded successfully.`
      );
    } catch (err) {
      console.error(err);
      toast.error("File upload failed. Please try again.");
    } finally {
      setUploading((s) => ({ ...s, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerAgency({
        name: form.name,
        bio: form.bio,
        agencyName: form.agencyName,
        licenseNumber: form.licenseNumber,
        licenseValidTill: form.licenseValidTill,
        city: form.city,
        experienceYears: Number(form.experienceYears),
        dealsClosed: Number(form.dealsClosed),
        areasServed: form.areasServed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        verificationStatus: "pending",
        coverImage: form.coverImage,
        avatar: form.avatar,
        rera: {
          reraAgentId: form.reraAgentId,
          isVerified: false,
        },
        stats: {
          totalProperties: 0,
          publishedCount: 0,
        },
        user: userId,
      });

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
                Avatar Image
              </label>
              <div className="flex items-center gap-2">
                {form.avatar && <img src={form.avatar} alt="Avatar Preview" className="w-10 h-10 rounded-full object-cover" />}
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  onChange={(e) => handleFileChange(e, "avatar")}
                  disabled={uploading.avatar}
                />
              </div>
              {uploading.avatar && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
            </div>
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>
              <div className="flex items-center gap-2">
                {form.coverImage && <img src={form.coverImage} alt="Cover Preview" className="w-10 h-10 rounded-md object-cover" />}
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                  disabled={uploading.coverImage}
                />
              </div>
              {uploading.coverImage && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
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
