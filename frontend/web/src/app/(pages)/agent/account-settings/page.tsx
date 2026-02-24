"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMembershipHistory,
  getMyAgentProfile,
  me,
  updateAgentProfileByPhone,
} from "@/data/ClientData";
import { Card, DetailRow, StatBox } from "@/ui/AgentPageComponents";
import { MdEdit, MdVerifiedUser } from "react-icons/md";
import { HiOutlineXMark } from "react-icons/hi2";
import { HiOutlineDownload } from "react-icons/hi";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import InputField from "@/ui/InputField";
import TextArea from "@/ui/TextArae";


type UpdateAgentPayload = Omit<ProfileEdit, "avatar" | "coverImage"> & {
  avatar?: File;
  coverImage?: File;
};

const ALLOWED_PROFILE_FIELDS: (keyof ProfileEdit)[] = [
  "name",
  "bio",
  "agencyName",
  "totalProperties",
  "publishedCount",
  "dealsClosed",
  "experienceYears",
  "areasServed",
  "languages",
  "verificationStatus",
  "coverImage",
  "avatar",
  "licenseNumber",
  "licenseValidTill",
  "city",
  "reraAgentId",
];

interface ProfileEdit {
  name?: string;
  bio?: string;
  agencyName?: string;
  totalProperties?: number;
  publishedCount?: number;
  dealsClosed?: number;
  experienceYears?: number;
  areasServed?: string[];
  languages?: string[];
  verificationStatus?: string;
  coverImage?: File | string;
  avatar?: File | string;
  licenseNumber?: string;
  licenseValidTill?: string;
  city?: string;
  reraAgentId?: string;
}

// Loading States
const LoadingState = () => (
  <div className="container mx-auto max-w-7xl py-8">
    <div className="flex items-center justify-center h-96">Loading…</div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="container mx-auto max-w-7xl py-8">
    <div className="flex items-center justify-center h-96 text-red-500">
      {message}
    </div>
  </div>
);

const NotFoundState = () => (
  <div className="container mx-auto max-w-7xl py-8">
    <div className="flex items-center justify-center h-96 text-gray-500">
      Agent profile not found.
    </div>
  </div>
);

// Image Preview Component
interface ImagePreviewProps {
  preview: string | null;
  formImage: File | string | undefined;
  agentImage: { url: string } | undefined;
  placeholder: string;
  type: "cover" | "avatar";
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImagePreview = ({
  preview,
  formImage,
  agentImage,
  placeholder,
  type,
  onImageSelect,
}: ImagePreviewProps) => {
  const getImageSrc = () => {
    if (preview) return preview;
    if (formImage instanceof File) return preview || placeholder;
    if (typeof formImage === "string") return formImage;
    return agentImage?.url || placeholder;
  };

  const sizeClasses = type === "cover" ? "h-40 w-full" : "h-20 w-20";
  const iconSize = type === "cover" ? "text-xl" : "text-sm";

  return (
    <div className={`relative ${sizeClasses} group`}>
      <Image
        src={getImageSrc()}
        alt={`${type} image`}
        fill
        className="object-cover"
      />
      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
        <MdEdit className={`text-white ${iconSize}`} />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageSelect}
        />
      </label>
    </div>
  );
};

// Modal Edit Form Component
interface EditModalProps {
  editFormData: ProfileEdit;
  isUpdating: boolean;
  coverPreview: string | null;
  avatarPreview: string | null;
  agent: any;
  onCancel: () => void;
  onSave: () => void;
  onImageSelect: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "avatar"
  ) => void;
  updateField: <K extends keyof ProfileEdit>(
    key: K,
    value: ProfileEdit[K]
  ) => void;
  updateArrayField: (key: "areasServed" | "languages", value: string) => void;
}

const EditModal = ({
  editFormData,
  isUpdating,
  coverPreview,
  avatarPreview,
  agent,
  onCancel,
  onSave,
  onImageSelect,
  updateField,
  updateArrayField,
}: EditModalProps) => (
  <div className="fixed inset-0 bg-black/60 z-90 flex items-center justify-center p-4">
    <div className="bg-white rounded-md shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Modal Header */}
      <div className="px-8 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <p className="text-sm text-gray-500">
            Update your professional information and presence.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white rounded-full transition-colors border border-gray-200 shadow-sm"
        >
          <HiOutlineXMark size={24} color="gray" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">
            Profile Images
          </h3>

          <div className="relative mb-20">
            {/* COVER */}
            <div className="relative h-40 w-full overflow-hidden rounded-xl border">
              <ImagePreview
                preview={coverPreview}
                formImage={editFormData.coverImage}
                agentImage={agent.coverImage}
                placeholder="/cover-placeholder.jpg"
                type="cover"
                onImageSelect={(e) => onImageSelect(e, "cover")}
              />
            </div>

            {/* AVATAR */}
            <div className="absolute -bottom-10 left-6 z-10">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden ring-4 ring-white shadow-lg">
                <ImagePreview
                  preview={avatarPreview}
                  formImage={editFormData.avatar}
                  agentImage={agent.avatar}
                  placeholder="/avatar-placeholder.jpg"
                  type="avatar"
                  onImageSelect={(e) => onImageSelect(e, "avatar")}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              value={editFormData.name || ""}
              onChange={(v) => updateField("name", v)}
            />
            <InputField
              label="Agency Name"
              value={editFormData.agencyName || ""}
              onChange={(v) => updateField("agencyName", v)}
            />
            <InputField
              label="City"
              value={editFormData.city || ""}
              onChange={(v) => updateField("city", v)}
            />
            <InputField
              label="Experience (Years)"
              type="number"
              value={editFormData.experienceYears ?? ""}
              onChange={(v) => updateField("experienceYears", Number(v))}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">
            Regulatory Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="License Number"
              value={editFormData.licenseNumber || ""}
              onChange={(v) => updateField("licenseNumber", v)}
            />
            <InputField
              label="License Valid Till"
              type="date"
              value={editFormData.licenseValidTill?.split("T")[0] || ""}
              onChange={(v) => updateField("licenseValidTill", v)}
            />
            <InputField
              label="RERA Agent ID"
              value={editFormData.reraAgentId || ""}
              onChange={(v) => updateField("reraAgentId", v)}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">
            Bio & Service Areas
          </h3>
          <div className="space-y-6">
            <TextArea
              label="Professional Bio"
              value={editFormData.bio || ""}
              onChange={(v) => updateField("bio", v)}
              rows={4}
              placeholder="Write a short summary about your expertise..."
            />
            <InputField
              label="Areas Served (comma separated)"
              value={(editFormData.areasServed || []).join(", ")}
              onChange={(v) => updateArrayField("areasServed", v)}
              placeholder="Gachibowli, Kondapur..."
            />
            <InputField
              label="Languages Spoken (comma separated)"
              value={(editFormData.languages || []).join(", ")}
              onChange={(v) => updateArrayField("languages", v)}
              placeholder="English, Hindi, Telugu..."
            />
          </div>
        </section>
      </div>

      {/* Modal Footer */}
      <div className="px-8 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isUpdating}
          className="px-4 py-2.5 btn btn-primary font-semibold"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
);

const AgentProfilePage = () => {
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ProfileEdit>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-agent-profile"],
    queryFn: getMyAgentProfile,
  });

  const {
    data: membership,
    isLoading: membershipLoading,
    isError: membershipError,
  } = useQuery({
    queryKey: ["membershipHistory"],
    queryFn: getMembershipHistory,
  });

  const queryClient = useQueryClient();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: me,
  });

  const phone = meData?.user?.phone;

  const { mutate: patchAgent, isPending: isUpdating } = useMutation({
    mutationFn: (payload: ProfileEdit) => {
      if (!phone) {
        toast.error("Phone number not found");
        throw new Error("Phone missing");
      }

      const cleanedPayload: UpdateAgentPayload = {
        ...payload,
        avatar: payload.avatar instanceof File ? payload.avatar : undefined,
        coverImage:
          payload.coverImage instanceof File ? payload.coverImage : undefined,
      };

      return updateAgentProfileByPhone(phone, cleanedPayload);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");

      queryClient.invalidateQueries({ queryKey: ["my-agent-profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] }); // 🔥 REQUIRED

      setEditMode(null);
    },

    onError: () => {
      toast.error("Failed to update profile");
    },
  });


  const handleEditStart = useCallback((section: string, data: ProfileEdit) => {
    setEditMode(section);
    setEditFormData(data);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditMode(null);
    setEditFormData({});
    setCoverPreview(null);
    setAvatarPreview(null);
  }, []);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "avatar") => {
      const file = e.target.files?.[0];
      if (!file) return;

      const preview = URL.createObjectURL(file);

      if (type === "cover") {
        setCoverPreview(preview);
        setEditFormData((prev) => ({
          ...prev,
          coverImage: file,
        }));
      } else {
        setAvatarPreview(preview);
        setEditFormData((prev) => ({
          ...prev,
          avatar: file,
        }));
      }
    },
    []
  );

  const cleanPayload = useCallback((payload: ProfileEdit): ProfileEdit => {
    return Object.keys(payload)
      .filter((key) =>
        ALLOWED_PROFILE_FIELDS.includes(key as keyof ProfileEdit)
      )
      .reduce((acc, key) => {
        (acc as Record<string, any>)[key] = payload[key as keyof ProfileEdit];
        return acc;
      }, {} as ProfileEdit);
  }, []);


  const handleEditSave = useCallback(() => {
    const payload = {
      ...editFormData,
      areasServed: editFormData.areasServed?.filter(Boolean),
      languages: editFormData.languages?.filter(Boolean),
    };
    patchAgent(cleanPayload(payload));
  }, [editFormData, cleanPayload, patchAgent]);

  const updateField = useCallback(
    <K extends keyof ProfileEdit>(key: K, value: ProfileEdit[K]) => {
      setEditFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );
  console

  const updateArrayField = useCallback(
    (key: "areasServed" | "languages", value: string) => {
      setEditFormData((prev) => ({
        ...prev,
        [key]: value.split(",").map((v) => v.trim()),
      }));
    },
    []
  );


  if (isLoading || membershipLoading) return <LoadingState />;
  if (isError || membershipError)
    return <ErrorState message="Failed to load agent profile." />;

  const agent = data?.agent;
  if (!agent) return <NotFoundState />;

  const handleEditButtonClick = useCallback(() => {
    handleEditStart("header", {
      name: agent.user?.name ?? "",
      bio: agent.bio ?? "",
      agencyName: agent.agencyName ?? "",
      city: agent.city ?? "",
      experienceYears: agent.experienceYears ?? 0,
      licenseNumber: agent.licenseNumber ?? "",
      licenseValidTill: agent.licenseValidTill ?? "",
      verificationStatus: agent.verificationStatus ?? "",
      areasServed: agent.areasServed ?? [],
      languages: agent.languages ?? [],
    });
  }, [agent, handleEditStart]);


  return (
    <div className="space-y-8 mx-auto max-w-7xl py-1">
      {/* ================= COVER & AVATAR ================= */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-56 w-full overflow-hidden rounded-xl">
          <Image
            src={agent.coverImage?.url || "/cover-placeholder.jpg"}
            alt="Cover"
            fill
            className="object-cover"
          />
        </div>

        {/* Avatar - Positioned relative to the parent container */}
        <div className="absolute -bottom-10 left-6 z-10">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl ring-4 ring-white">
            <Image
              src={agent.avatar?.url || "/avatar-placeholder.jpg"}
              alt={agent.user?.name || "Agent Avatar"}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-xl p-6 pt-14 shadow-md flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">
              {agent.user?.name}
            </h1>

            {agent.rera?.isVerified && (
              <span className="inline-flex items-center gap-1 bg-[#26ad5f] text-white px-3 py-1 rounded-md text-xs font-semibold shadow-sm">
                <MdVerifiedUser size={14} />
                Verified
              </span>
            )}
          </div>

          <p className="text-gray-600 mt-1 font-medium">
            {agent.agencyName} · {agent.city}
          </p>

          <p className="italic text-gray-500 mt-2 text-sm">{agent.bio}</p>
        </div>

        <button
          onClick={handleEditButtonClick}
          className="ml-4 flex items-center gap-2 border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-50 font-medium transition"
        >
          <MdEdit size={16} />
          Edit Profile
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="Total Properties"
          value={agent.stats?.totalProperties ?? 0}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatBox
          label="Published"
          value={agent.stats?.publishedCount ?? 0}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <StatBox
          label="Deals Closed"
          value={agent.dealsClosed}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
        <StatBox
          label="Experience"
          value={`${agent.experienceYears} yrs`}
          bgColor="bg-orange-50"
          textColor="text-orange-600"
        />
      </div>

      {/* ================= DETAILS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Professional Details">
          <DetailRow label="License No" value={agent.licenseNumber} />
          <DetailRow
            label="Valid Till"
            value={new Date(agent.licenseValidTill).toLocaleDateString()}
          />
          <DetailRow label="Verification" value={agent.verificationStatus} />
        </Card>

        <Card title="Service Information">
          <DetailRow
            label="Areas Served"
            value={agent.areasServed.join(", ")}
          />
          <DetailRow label="Languages" value={agent.languages.join(", ")} />
        </Card>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="City">
          <p className="text-lg font-medium">{agent.city}</p>
        </Card>

        <Card title="Years of Experience">
          <p className="text-lg font-medium">{agent.experienceYears} Years</p>
        </Card>
      </div>

      {membership?.history?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-medium text-[#545454]">
              Membership History
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Category
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Price
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-400">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {membership.history.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-semibold text-gray-800 leading-none">
                          {item.planName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          {item.planCode?.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                      {item.category}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span>{formatDate(item.startDate)}</span>
                        <span className="text-xs text-gray-400">
                          to {formatDate(item.endDate)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      INR {item.price}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <StatusBadge status={item.status} />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        {item.invoiceUrl ? (
                          <a
                            href={item.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-[#27AE60] hover:text-white"
                          >
                            <HiOutlineDownload size={14} />
                            Download Invoice
                          </a>
                        ) : (
                          <span className="text-xs italic text-gray-400">
                            No invoice available
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editMode === "header" && (
        <EditModal
          editFormData={editFormData}
          isUpdating={isUpdating}
          coverPreview={coverPreview}
          avatarPreview={avatarPreview}
          agent={agent}
          onCancel={handleEditCancel}
          onSave={handleEditSave}
          onImageSelect={handleImageSelect}
          updateField={updateField}
          updateArrayField={updateArrayField}
        />
      )}
    </div>
  );
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold
    ${isActive ? "bg-[#E9F9EF] text-[#1E7F4B]" : "bg-[#EBEDEF] text-[#7F8C8D]"}
    `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full
      ${isActive ? "bg-[#27AE60]" : "bg-[#95A5A6]"}`}
      />
      {isActive ? "Active" : "Expired"}
    </span>
  );
};

export default AgentProfilePage;
