"use client";
import Modal from "../ui/Modal";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { useEffect } from "react";

export function LocationDialog({
  open,
  onClose,
  onCityDetect,
}: {
  open: boolean;
  onClose: () => void;
  onCityDetect: (city: string) => void;
}) {
  const { status, coords, requestAccess } = useLocationPermission();

  useEffect(() => {
    if (status === "granted" && coords) {
      fetch(`/api/users/locations/reverse?lat=${coords.lat}&lon=${coords.lon}`)
        .then((res) => res.json())
        .then((data) => {
          onCityDetect(data.city || data.state || data.country || "Unknown");
          onClose();
        });
    }
  }, [status, coords]);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-800">Allow Location Access</h2>
      <p className="text-sm text-gray-500 mt-2">
        We use your location to show nearby properties & best project matches.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
          onClick={onClose}
        >
          Not Now
        </button>

        <button
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          onClick={requestAccess}
        >
          Allow
        </button>
      </div>
    </Modal>
  );
}
