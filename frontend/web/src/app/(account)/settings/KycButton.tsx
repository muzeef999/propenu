"use client";

import { startKyc } from "@/data/ClientData";


export default function KycButton() {
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

  return (
    <button
      onClick={handleStartKyc}
      className="px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer"
    >
      Verify KYC
    </button>
  );
}