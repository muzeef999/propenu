"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAgentProfile, updateAgentProfile } from "@/data/ClientData";
import { Card, DetailRow, StatBox } from "@/ui/AgentPageComponents";
import { MdEdit, MdVerifiedUser, MdClose, MdCheck } from "react-icons/md";
import { HiOutlineXMark } from "react-icons/hi2";
import { toast } from "sonner";
import { useState } from "react";

// TODO: This should be dynamic, e.g., from the user's session or a route parameter.
const AGENT_ID = "693271916bb8771f528d0fa4";

const AgentProfilePage = () => {
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent-profile", AGENT_ID],
    queryFn: () => getAgentProfile(AGENT_ID),
  });

  const queryClient = useQueryClient();

const { mutate: patchAgent, isPending: isUpdating } = useMutation({
  mutationFn: (payload: any) => updateAgentProfile(AGENT_ID, payload),
  onSuccess: () => {
    toast.success("Profile updated successfully");
    queryClient.invalidateQueries({
      queryKey: ["agent-profile", AGENT_ID],
    });
    setEditMode(null);
  },
  onError: () => {
    toast.error("Failed to update profile");
  },
});

const handleEditStart = (section: string, data: any) => {
  setEditMode(section);
  setEditFormData(data);
};

const handleEditCancel = () => {
  setEditMode(null);
  setEditFormData({});
};

const handleEditSave = (section: string) => {
  patchAgent(editFormData);
};


  if (isLoading)
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-center h-96">Loading…</div>
      </div>
    );

  if (isError)
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-center h-96 text-red-500">
          Failed to load agent profile.
        </div>
      </div>
    );

  const agent = data?.agent;
  console.log("Agent Profile Data:", agent);

  if (!agent)
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-center h-96 text-gray-500">
          Agent profile not found.
        </div>
      </div>
    );

  return (
    <div className="container space-y-8 mx-auto max-w-7xl py-8">
      {/* ================= COVER ================= */}
      <div className="relative h-56 rounded-xl overflow-hidden">
        <Image
          src={agent.coverImage?.url || "/cover-placeholder.jpg"}
          alt="Cover"
          fill
          className="object-cover"
        />

        {/* Avatar */}
        <div className="absolute left-6 -bottom-6">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden ring-4 ring-white">
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
        {editMode === 'header' ? (
          <EditHeaderModal 
            data={editFormData}
            onSave={() => handleEditSave('header')}
            onCancel={handleEditCancel}
            onChange={setEditFormData}
            isLoading={isUpdating}
          />
        ) : (
          <>
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
              onClick={() => handleEditStart('header', { name: agent.user?.name, bio: agent.bio, agencyName: agent.agencyName })}
              className="ml-4 flex items-center gap-2 border border-green-600 text-green-600 px-4 py-2 rounded-lg text-sm hover:bg-green-50 font-medium transition">
              <MdEdit size={16} />
              Edit Profile
            </button>
          </>
        )}
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
        <div>
          {editMode === 'professional' ? (
            <EditProfessionalModal 
              data={editFormData}
              onSave={() => handleEditSave('professional')}
              onCancel={handleEditCancel}
              onChange={setEditFormData}
              isLoading={isUpdating}
            />
          ) : (
            <Card 
              title="Professional Details"
              onEdit={() => handleEditStart('professional', {
                licenseNumber: agent.licenseNumber,
                licenseValidTill: agent.licenseValidTill,
                verificationStatus: agent.verificationStatus
              })}
            >
              <DetailRow label="License No" value={agent.licenseNumber} />
              <DetailRow
                label="Valid Till"
                value={new Date(agent.licenseValidTill).toLocaleDateString()}
              />
              <DetailRow label="Verification" value={agent.verificationStatus} />
            </Card>
          )}
        </div>

        <div>
          {editMode === 'service' ? (
            <EditServiceModal 
              data={editFormData}
              onSave={() => handleEditSave('service')}
              onCancel={handleEditCancel}
              onChange={setEditFormData}
              isLoading={isUpdating}
            />
          ) : (
            <Card 
              title="Service Information"
              onEdit={() => handleEditStart('service', {
                areasServed: agent.areasServed,
                languages: agent.languages
              })}
            >
              <DetailRow
                label="Areas Served"
                value={agent.areasServed.join(", ")}
              />
              <DetailRow label="Languages" value={agent.languages.join(", ")} />
            </Card>
          )}
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {editMode === 'city' ? (
            <EditCityModal 
              data={editFormData}
              onSave={() => handleEditSave('city')}
              onCancel={handleEditCancel}
              onChange={setEditFormData}
              isLoading={isUpdating}
            />
          ) : (
            <Card 
              title="City"
              onEdit={() => handleEditStart('city', { city: agent.city })}
            >
              <p className="text-lg font-medium">{agent.city}</p>
            </Card>
          )}
        </div>

        <div>
          {editMode === 'experience' ? (
            <EditExperienceModal 
              data={editFormData}
              onSave={() => handleEditSave('experience')}
              onCancel={handleEditCancel}
              onChange={setEditFormData}
              isLoading={isUpdating}
            />
          ) : (
            <Card 
              title="Years of Experience"
              onEdit={() => handleEditStart('experience', { experienceYears: agent.experienceYears })}
            >
              <p className="text-lg font-medium">{agent.experienceYears} Years</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= EDIT MODALS =================

const EditHeaderModal = ({ data, onSave, onCancel, onChange, isLoading }: any) => (
  <div className="w-full bg-white rounded-xl p-6 border-2 border-green-500">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile Information</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter full name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
        <input
          type="text"
          value={data.agencyName || ''}
          onChange={(e) => onChange({ ...data, agencyName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter agency name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <textarea
          value={data.bio || ''}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter bio"
          rows={4}
        />
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
      >
        <MdCheck className="inline mr-2" size={18} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        <HiOutlineXMark className="inline mr-2" size={18} />
        Cancel
      </button>
    </div>
  </div>
);

const EditProfessionalModal = ({ data, onSave, onCancel, onChange, isLoading }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-500">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Professional Details</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
        <input
          type="text"
          value={data.licenseNumber || ''}
          onChange={(e) => onChange({ ...data, licenseNumber: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter license number"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Valid Till</label>
        <input
          type="date"
          value={data.licenseValidTill ? new Date(data.licenseValidTill).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange({ ...data, licenseValidTill: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
        <select
          value={data.verificationStatus || ''}
          onChange={(e) => onChange({ ...data, verificationStatus: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
        >
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Unverified">Unverified</option>
        </select>
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
      >
        <MdCheck className="inline mr-2" size={18} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        <HiOutlineXMark className="inline mr-2" size={18} />
        Cancel
      </button>
    </div>
  </div>
);

const EditServiceModal = ({ data, onSave, onCancel, onChange, isLoading }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-500">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Service Information</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Areas Served (comma-separated)</label>
        <textarea
          value={Array.isArray(data.areasServed) ? data.areasServed.join(', ') : ''}
          onChange={(e) => onChange({ ...data, areasServed: e.target.value.split(',').map(s => s.trim()) })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter areas served"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma-separated)</label>
        <textarea
          value={Array.isArray(data.languages) ? data.languages.join(', ') : ''}
          onChange={(e) => onChange({ ...data, languages: e.target.value.split(',').map(s => s.trim()) })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter languages"
          rows={3}
        />
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
      >
        <MdCheck className="inline mr-2" size={18} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        <HiOutlineXMark className="inline mr-2" size={18} />
        Cancel
      </button>
    </div>
  </div>
);

const EditCityModal = ({ data, onSave, onCancel, onChange, isLoading }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-500">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Edit City</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
        <input
          type="text"
          value={data.city || ''}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter city"
        />
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
      >
        <MdCheck className="inline mr-2" size={18} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        <HiOutlineXMark className="inline mr-2" size={18} />
        Cancel
      </button>
    </div>
  </div>
);

const EditExperienceModal = ({ data, onSave, onCancel, onChange, isLoading }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-500">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Years of Experience</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Years</label>
        <input
          type="number"
          value={data.experienceYears || ''}
          onChange={(e) => onChange({ ...data, experienceYears: parseInt(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Enter years of experience"
          min="0"
        />
      </div>
    </div>
    <div className="flex gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="flex-1 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
      >
        <MdCheck className="inline mr-2" size={18} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
      >
        <HiOutlineXMark className="inline mr-2" size={18} />
        Cancel
      </button>
    </div>
  </div>
);

export default AgentProfilePage;
