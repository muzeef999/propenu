"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { me, getMembershipHistory, updateUser } from "@/data/ClientData";
import { MdOutlineLocationOn, MdOutlineWorkspacePremium } from "react-icons/md";
import { HiOutlineDownload } from "react-icons/hi";
import { toast } from "sonner";

type InfoFieldProps = {
  label: string;
  value?: string | number | null;
};

type FormData = {
  name: string;
  email: string;
  address: string;
};

const SettingsPage = () => {
  const queryClient = useQueryClient();

  /* -------------------- User Profile -------------------- */
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: me,
  });

  /* -------------------- Membership History -------------------- */
  const {
    data: membership,
    isLoading: membershipLoading,
    isError: membershipError,
  } = useQuery({
    queryKey: ["membershipHistory"],
    queryFn: getMembershipHistory,
  });

  /* -------------------- Update User -------------------- */
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<FormData>) => updateUser(data),
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update profile."
      );
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (user?.user) {
      setFormData({
        name: user.user.name || "",
        email: user.user.email || "",
        address: user.user.address || "",
      });
    }
  }, [user]);


  /* -------------------- Loading -------------------- */
  if (userLoading || membershipLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  /* -------------------- Error -------------------- */
  if (userError || membershipError || !user) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load user profile
      </div>
    );
  }
  console.log("Membership History:", user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };


  /* -------------------- Success -------------------- */
  return (
    <div className="p-1 font-sans text-[#4A4A4A]">
      <div className="max-w-5xl space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-semibold shadow-sm">
            {user?.user?.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.user.name}
            </h2>

            <p className="flex items-center gap-1 text-gray-400 text-sm capitalize">
              {user.user.roleName}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-3">
          <div className="px-1 flex justify-between items-center">
            <h3 className="text-lg font-medium text-[#545454]">
              Personal information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                  <EditableField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  <EditableField
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <InfoField label="Phone Number" value={user.user.phone} />
                  <EditableField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                <InfoField label="Name" value={user.user.name} />
                <InfoField label="Email Address" value={user.user.email} />
                <InfoField label="Phone Number" value={user.user.phone} />
                <InfoField label="Address" value={user.user.address} />
              </div>
            )}
          </div>
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
                    {/* Use text-center on all TH elements */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 ">Plan</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 ">Category</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 ">Duration</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 ">Price</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                    {/* Removed text-right so this one is centered too */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 ">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {membership.history.map((item: any, index: number) => {
                    const isActive = item.status === "active";

                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        {/* Plan Name & Code - Centered Flex */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <p className="font-semibold text-gray-800 leading-none">{item.planName}</p>
                            <p className="text-xs text-gray-400 mt-1 capitalize">
                              {item.planCode?.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                          {item.category}
                        </td>

                        {/* Duration - Centered Flex */}
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex flex-col">
                            <span>{formatDate(item.startDate)}</span>
                            <span className="text-xs text-gray-400">to {formatDate(item.endDate)}</span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          ₹{item.price}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {/* Ensure the badge container itself doesn't force left-alignment */}
                          <div className="">
                            <StatusBadge status={item.status} />
                          </div>
                        </td>

                        {/* Action - Changed text-right to text-center */}
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
                              <span className="text-xs italic text-gray-400">No invoice available</span>
                            )}
                          </div>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const InfoField = ({ label, value }: InfoFieldProps) => (
  <div className="flex flex-col gap-1">
    <p className="text-[12px] tracking-wider text-gray-400">{label}</p>
    <p className="text-gray-800 font-medium text-sm">{value || "—"}</p>
  </div>
);

const EditableField = ({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[12px] tracking-wider text-gray-400">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="text-gray-800 font-medium text-sm p-2 border border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 transition"
    />
  </div>
);

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
    ${isActive
          ? "bg-[#E9F9EF] text-[#1E7F4B]"
          : "bg-[#EBEDEF] text-[#7F8C8D]"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full
      ${isActive ? "bg-[#27AE60]" : "bg-[#95A5A6]"}`}
      />
      {isActive ? "Active" : "Expired"}
    </span>

  );
};;


export default SettingsPage;
