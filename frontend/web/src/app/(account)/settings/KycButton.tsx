"use client";

import { startKyc } from "@/data/ClientData";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaUserShield,
} from "react-icons/fa";

interface Props {
  kycStatus?: string;
  kycRemarks?: string;
}

export default function KycButton({ kycStatus, kycRemarks }: Props) {
  const handleStartKyc = async () => {
    try {
      console.log("Starting KYC process...");
      const data = await startKyc();

      console.log("KYC API response:", data);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start KYC");
    }
  };

  // ✅ VERIFIED
  if (kycStatus === "verified") {
    return (
      <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
        <FaCheckCircle />
        KYC Verified
      </div>
    );
  }

  // ⏳ PENDING
  if (kycStatus === "pending") {
    return (
      <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
        <FaClock />
        KYC Pending
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm font-semibold">
          <FaTimesCircle />
          KYC Rejected
        </div>

        {kycRemarks && (
          <p className="text-xs text-red-600">Reason: {kycRemarks}</p>
        )}

        <button
          onClick={handleStartKyc}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition"
        >
          <FaUserShield />
          Retry KYC
        </button>
      </div>
    );
  }

  // ❌ NOT VERIFIED
  return (
    <button
      onClick={handleStartKyc}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition"
    >
      <FaUserShield />
      Verify KYC
    </button>
  );
}
