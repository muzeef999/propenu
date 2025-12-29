"use client";

import React from "react";
import { MdOutlineCameraAlt, MdOutlineVerified } from "react-icons/md";
import { HiOutlinePencilAlt } from "react-icons/hi";

type InfoFieldProps = {
  label: string;
  value: string | number;
};

const SettingsPage = () => {
  const user = {
    name: "Narahari Sharma",
    email: "Naraharisharma@gmail.com",
    phone: "9876543219",
    city: "Hyderabad",
    pincode: "503702",
  };

  return (
    <div className="p-1 font-sans text-[#4A4A4A]">
      <div className="max-w-5xl space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="relative cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&h=150&auto=format&fit=crop"
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-200 shadow-sm text-gray-600">
              <MdOutlineCameraAlt size={14} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.name}
            </h2>
            <p className="text-gray-400 text-xs">{user.city}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-medium text-[#545454]">
              Personal information
            </h3>
            <button className="flex items-center gap-1.5 border border-gray-200 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Edit <HiOutlinePencilAlt size={16} />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              <InfoField label="First Name" value="Narahari" />
              <InfoField label="Last Name" value="Sharma" />
              <InfoField label="Email Address" value={user.email} />
              <InfoField label="Phone Number" value={user.phone} />
              <InfoField label="City" value={user.city} />
              <InfoField label="Pincode" value={user.pincode} />
            </div>
          </div>
        </div>

        {/* KYC Verification */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#545454] px-1">
            KYC Verification
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
            <span className="text-gray-400">Driving License</span>
            <span className="text-[#27A361] font-medium flex items-center gap-1.5 text-sm">
              <MdOutlineVerified size={18} />
              Verification done
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button className="text-[#D32F2F] underline text-sm font-medium hover:text-red-700">
            Deactivate Account
          </button>
        </div>

      </div>
    </div>
  );
};

const InfoField = ({ label, value }: InfoFieldProps) => (
  <div className="flex flex-col gap-1">
    <p className="text-[12px] tracking-wider text-gray-400">
      {label}
    </p>
    <p className="text-gray-800 font-medium text-sm">
      {value}
    </p>
  </div>
);

export default SettingsPage;
