"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { me, getMembershipHistory } from "@/data/ClientData";
import { MdOutlineLocationOn } from "react-icons/md";

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

  console.log("USER 👉", user);
  console.log("MEMBERSHIP 👉", membership);

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

            <p className="flex items-center gap-1 text-gray-400 text-xs">
              <MdOutlineLocationOn size={14} />
              {user.city || "—"}
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

        {/* Membership Info (example) */}
        {membership && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-medium text-[#545454] mb-2">
              Membership
            </h3>
            <p className="text-sm text-gray-700">
              Plan: <b>{membership.planName}</b>
            </p>
            <p className="text-sm text-gray-700">
              Status: <b>{membership.status}</b>
            </p>
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

export default SettingsPage;
