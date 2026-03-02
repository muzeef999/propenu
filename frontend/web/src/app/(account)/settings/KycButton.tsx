"use client";

import { startKyc } from "@/data/ClientData";
import { FaCheckCircle, FaClock, FaUserShield } from "react-icons/fa";

interface Props {
  kycStatus?: string;
}

export default function KycButton({ kycStatus }: Props) {
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