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
  className?: string;
}

export default function KycButton({ kycStatus, kycRemarks, className }: Props) {
  const handleStartKyc = async () => {
    try {
      const data = await startKyc();


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
          className={`flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 cursor-pointer ${className}`}
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
      className={`flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 cursor-pointer ${className}`}
    >
      <FaUserShield />
      Verify KYC
    </button>
  );
}
