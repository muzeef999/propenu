"use client";

import { useQuery } from "@tanstack/react-query";
import { HiX, HiDownload, HiOutlineCalendar } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { getProjectLeads } from "@/data/ClientData";

type Lead = {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  remarks?: string;
  propertyTitle?: string;
  status?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
};

export default function ResponsesDrawer({ open, onClose, projectId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-leads", projectId],
    queryFn: () => getProjectLeads(projectId!),
    enabled: open && !!projectId,
  });

  if (!open) return null;

  const leads: Lead[] = (data?.data ?? [])
    .slice()
    .sort((a: Lead, b: Lead) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const handleDownloadCsv = () => {
    if (leads.length === 0) return;
    const headers = ["Name", "Phone", "Email", "Viewed Date", "Property Title"];
    const csvContent = [
      headers.join(","),
      ...leads.map((lead) => {
        const row = [
          lead.name ?? "Unknown",
          lead.phone ?? "—",
          lead.email ?? "—",
          lead.createdAt
            ? new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—",
          lead.propertyTitle || "N/A",
        ];
        return row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inquiries-${projectId?.toUpperCase() ?? "N-A"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  console.log("Responses Drawer Rendered:", { open, projectId, leads });

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[440px] bg-[#f1f9f4] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-gray-800">
                {leads.length} Inquiries for
              </h2>
              <p className="text-base text-gray-600">
                Property ID: <span className="text-gray-900">{projectId?.slice(-8).toUpperCase() ?? "N/A"}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <HiOutlineCalendar className="w-5 h-5" />
              </button>
              <button onClick={handleDownloadCsv} className="text-gray-600 hover:text-gray-900 transition-colors">
                <HiDownload className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-900 transition-colors ml-2">
                <HiX className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {isLoading ? (
            <p className="text-center py-10 text-gray-500">Loading enquiries...</p>
          ) : leads.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-medium">No inquiries found</p>
          ) : (
            leads.map((lead) => (
              <div key={lead._id} className="bg-white rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative">
                {/* Status Badge */}
                <span className="absolute top-5 right-5 text-xs font-medium text-[#4CAF50] capitalize">
                  {lead.status}
                </span>

                {/* Profile Header */}
                <div className="flex items-center gap-3 mb">
                  <div className="w-10 h-10 rounded-full bg-[#8A4CFF] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {lead.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <span className="font-bold text-gray-800 text-base">
                    {lead.name ?? "Unknown"}
                  </span>
                </div>

                {/* Details Section */}
                <div className="ml-[52px] space-y-2">
                  <p className="text-gray-500 text-sm leading-snug">
                    {lead.remarks || "2 BHK Apartment for sale in gandimaisa..."}
                  </p>
                  
                  <p className="text-sm">
                    <span className="text-gray-400">Viewed Contact</span> on{" "}
                    <span className="text-gray-500 font-medium">
                       {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "25 Dec, 2025"}
                    </span>
                  </p>

                  <div className="pt-3 mt-1 flex items-center justify-between border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>{lead.phone ?? "+91-8185094463"}</span>
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:scale-110 transition-transform"
                          aria-label="Chat on WhatsApp"
                        >
                          <FaWhatsapp className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <span className="text-gray-400 font-normal text-sm">{lead.email ?? "-"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}