"use client";

import React from 'react';
import { MdOutlineCameraAlt, MdOutlineVerified } from "react-icons/md";
import { HiOutlinePencilAlt } from "react-icons/hi";

const SettingsPage = () => {
  const user = {
    name: "Narahari Sharma",
    email: "Naraharisharma@gmail.com",
    phone: "9876543219",
    city: "Hyderabad",
    pincode: "503702",
  };

  return (
    <div className="min-h-screen p-4 md:p-7 font-sans text-[#4A4A4A] container">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 1. Promo Banner */}
        <section className="relative overflow-hidden bg-[#E8F5EE] rounded-xl px-6 py-4 md:py-3 flex flex-col md:flex-row justify-between items-center border border-[#D1E7DD]">
          <div className="z-10 space-y-3 max-w-lg text-center md:text-left">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 leading-snug">
              Unlock more owner contacts & more opportunities with subscriptions
            </h2>
            <button className="bg-[#27A361] hover:bg-[#1f8a50] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
              Upgrade your Plan
            </button>
          </div>
          
          <div className="relative mt-4 md:mt-0 h-24 md:h-28">
              <img 
                src="https://illustrations.popsy.co/emerald/customer-support.svg" 
                alt="Promo"
                className="h-full w-auto object-contain"
              />
          </div>
        </section>

        {/* 2. Profile Card */}
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
            <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
            <p className="text-gray-400 text-xs">{user.city}</p>
          </div>
        </div>

        {/* 3. Personal Information */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-lg font-medium text-[#545454]">Personal information</h3>
             <button className="flex items-center gap-1.5 border border-gray-200 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-all">
               Edit <HiOutlinePencilAlt size={16} />
             </button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              <InfoField label="First Name" value="Narahari" />
              <InfoField label="Last Name" value="Sharma" />
              <InfoField label="Email Adress" value={user.email} />
              <InfoField label="Phone Number" value={user.phone} />
              <InfoField label="City" value={user.city} />
              <InfoField label="Pincode" value={user.pincode} />
            </div>
          </div>
        </div>

        {/* 4. KYC Verification */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-[#545454] px-1">KYC Verification</h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
            <span className="text-gray-400">Driving License</span>
            <span className="text-[#27A361] font-medium flex items-center gap-1.5 text-sm">
              <MdOutlineVerified size={18} /> Verification done
            </span>
          </div>
        </div>

        {/* 5. Footer */}
        <div className="pt-2">
          <button className="text-[#D32F2F] underline text-sm font-medium hover:text-red-700">
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[12px] tracking-wider text-gray-400 font-normal">{label}</p>
    <p className="text-gray-800 font-medium text-sm">{value}</p>
  </div>
);

export default SettingsPage;