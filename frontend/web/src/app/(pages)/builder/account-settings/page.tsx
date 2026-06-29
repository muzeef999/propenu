"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BuilderProfilePayload,
  getBuilderProfile,
  updateBuilderProfile,
} from "@/data/ClientData";
import { FiBriefcase, FiEdit2, FiMail, FiMapPin, FiPhone, FiSave, FiX } from "react-icons/fi";
import { toast } from "sonner";

type BuilderProfile = {
  id: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountStatus?: string;
};

const emptyForm: Required<BuilderProfilePayload> = {
  name: "",
  companyName: "",
  email: "",
  address: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
};

const toForm = (profile?: BuilderProfile): Required<BuilderProfilePayload> => ({
  name: profile?.name || "",
  companyName: profile?.companyName || "",
  email: profile?.email || "",
  address: profile?.address || "",
  locality: profile?.locality || "",
  city: profile?.city || "",
  state: profile?.state || "",
  pincode: profile?.pincode || "",
});

export default function BuilderAccountSettingsPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const profileQuery = useQuery<{ profile: BuilderProfile }>({
    queryKey: ["builder-profile"],
    queryFn: getBuilderProfile,
  });

  const profile = profileQuery.data?.profile;

  useEffect(() => {
    if (profile) {
      setFormData(toForm(profile));
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateBuilderProfile,
    onSuccess: () => {
      toast.success("Builder profile updated");
      queryClient.invalidateQueries({ queryKey: ["builder-profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update builder profile");
    },
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(toForm(profile));
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    updateMutation.mutate(formData);
  };

  if (profileQuery.isLoading) {
    return <div className="py-20 text-center text-gray-500">Loading builder profile...</div>;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Failed to load builder profile.
      </div>
    );
  }

  const avatarLabel = (profile.companyName || profile.name || "B").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[#DDE8E1] bg-white shadow-sm">
        <div className="border-b border-[#E6EFE9] bg-[#F4FAF6] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-xl font-semibold text-white">
                {avatarLabel}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
                  Builder Profile
                </p>
                <h1 className="mt-1 text-xl font-semibold text-gray-950 sm:text-2xl">
                  {profile.companyName || "Company profile"}
                </h1>
                <p className="mt-1 text-sm text-gray-600">{profile.name || "Builder account"}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <FiX className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-60"
                >
                  <FiSave className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D]"
              >
                <FiEdit2 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-px bg-[#E6EFE9] md:grid-cols-3">
          <SummaryItem icon={FiBriefcase} label="Company" value={profile.companyName} />
          <SummaryItem icon={FiPhone} label="Phone" value={profile.phone} />
          <SummaryItem
            icon={FiMapPin}
            label="Location"
            value={[profile.locality, profile.city].filter(Boolean).join(", ")}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Company Details</h2>
            <p className="mt-1 text-sm text-gray-500">Primary identity shown for builder-owned projects.</p>
          </div>
          <FiBriefcase className="h-5 w-5 text-[#16A34A]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Builder Name" name="name" value={formData.name} onChange={handleChange} />
              <EditableField
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </>
          ) : (
            <>
              <ReadOnlyField label="Builder Name" value={profile.name} />
              <ReadOnlyField label="Company Name" value={profile.companyName} />
            </>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Contact & Location</h2>
            <p className="mt-1 text-sm text-gray-500">Keep contact and office location details current.</p>
          </div>
          <FiMail className="h-5 w-5 text-[#16A34A]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isEditing ? (
            <>
              <EditableField label="Email" name="email" value={formData.email} onChange={handleChange} />
              <ReadOnlyField label="Phone" value={profile.phone} />
              <EditableField label="Locality" name="locality" value={formData.locality} onChange={handleChange} />
              <EditableField label="City" name="city" value={formData.city} onChange={handleChange} />
              <EditableField label="State" name="state" value={formData.state} onChange={handleChange} />
              <EditableField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
            </>
          ) : (
            <>
              <ReadOnlyField label="Email" value={profile.email} />
              <ReadOnlyField label="Phone" value={profile.phone} />
              <ReadOnlyField label="Locality" value={profile.locality} />
              <ReadOnlyField label="City" value={profile.city} />
              <ReadOnlyField label="State" value={profile.state} />
              <ReadOnlyField label="Pincode" value={profile.pincode} />
            </>
          )}
        </div>

        <div className="mt-4">
          {isEditing ? (
            <TextAreaField label="Office Address" name="address" value={formData.address} onChange={handleChange} />
          ) : (
            <ReadOnlyField label="Office Address" value={profile.address} />
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="bg-white px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50 text-[#16A34A]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">{value || "Not set"}</p>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 min-h-6 text-sm font-medium text-gray-900">{value || "Not set"}</p>
    </div>
  );
}

function EditableField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="mt-2 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}
