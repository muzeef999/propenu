"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { me, getMembershipHistory } from "@/data/ClientData";
import { MdOutlineLocationOn, MdOutlineWorkspacePremium } from "react-icons/md";
import { HiOutlineDownload } from "react-icons/hi";

type InfoFieldProps = {
  label: string;
  value?: string | number | null;
};

const SettingsPage = () => {
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
          <div className="px-1">
            <h3 className="text-lg font-medium text-[#545454]">
              Personal information
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              <InfoField label="Name" value={user.name} />
              <InfoField label="Email Address" value={user.email} />
              <InfoField label="Phone Number" value={user.phone} />
              <InfoField label="City" value={user.city} />
              <InfoField label="Pincode" value={user.pincode} />
            </div>
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
