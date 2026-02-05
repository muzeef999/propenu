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

        {membership?.history?.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-medium text-[#545454]">
                Membership History
              </h3>
              {/* <button className="text-sm text-gray-400 hover:text-gray-600 font-medium">
                View All &gt;
              </button> */}
            </div>

            {membership.history.map((item: any, index: number) => {
              const isActive = item.status === "active";

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative"
                >
                  {/* Status Badge - Positioned Top Right */}
                  <div className="absolute top-6 right-6">
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Plan Illustration/Icon */}
                  <div className="w-24 h-24 rounded-xl bg-[#F4F9F5] flex items-center justify-center overflow-hidden shrink-0">
                    {/* You can replace this with an actual <img> tag for the stack of money/papers icon */}
                    <span className="text-4xl">
                      {isActive ? (
                        <MdOutlineWorkspacePremium
                          size={50}
                          className="text-[#27AE60]"   // green for active
                        />
                      ) : (
                        <span className="text-gray-400">📄</span>
                      )}
                    </span>

                  </div>

                  {/* Content Area */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-semibold text-gray-800">
                          {item.planName}
                        </h4>
                        <span className="text-xs text-gray-500 font-normal">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-50 pt-4">
                      <div>
                        <p className="text-sm text-gray-400 font-semibold mb-1">Start Date</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(item.startDate)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 font-semibold mb-1 text-center md:text-left">Price</p>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <span className="text-gray-700 font-normal">₹</span> {item.price}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 font-semibold mb-1">Category</p>
                        <p className="text-sm font-medium text-gray-700 capitalize">{item.category}</p>
                      </div>

                      <div>
                        <p className="text-sm  text-gray-400 font-semibold mb-1">Plan Code</p>
                        <p className="text-sm font-medium text-gray-700">{item.planCode?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-2">
                      {item.invoiceUrl ? (
                        <a
                          href={item.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className=" text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center gap-1 btn-primary"
                        >
                          <HiOutlineDownload size={18} />
                          Download Invoice
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 font-medium">
                          No invoice
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
      className={`px-4 py-1.5 text-[11px] rounded-lg font-bold uppercase tracking-tight
        ${isActive
          ? "bg-[#27AE60] text-white"
          : "bg-[#EBEDEF] text-[#7F8C8D]"}`}
    >
      {isActive ? "Active" : "Expired"}
    </span>
  );
};;


export default SettingsPage;
