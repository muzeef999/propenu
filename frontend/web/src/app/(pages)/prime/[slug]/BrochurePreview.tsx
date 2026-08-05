"use client";

import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { trackProjectBrochureDownload } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { trackInteraction } from "@/services/trackingService";
import Cookies from "js-cookie";
import { useState } from "react";
import { HiArrowDownTray, HiDocumentText } from "react-icons/hi2";

type BrochurePreviewProps = {
  project: FeaturedProject;
};

export default function BrochurePreview({ project }: BrochurePreviewProps) {
  const brochure = project.brochure;
  const color = project.color?.trim() || "#27AE60";
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  if (!brochure?.url) return null;

  const isPdf =
    brochure.mimetype?.toLowerCase().includes("pdf") ||
    brochure.url.toLowerCase().includes(".pdf");
  const previewUrl = isPdf
    ? `${brochure.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
    : brochure.url;

  const handleBrochureDownload = async () => {
    const token = Cookies.get("token")?.trim();
    if (!token) {
      setShowRegisterDialog(false);
      setShowLoginDialog(true);
      return;
    }

    if (project._id) {
      try {
        await trackProjectBrochureDownload(project._id);
      } catch {
        // Do not block the download if tracking fails.
      }
    }

    trackInteraction({
      eventType: "brochure_downloaded",
      eventCategory: "conversion",
      entityType: "project",
      projectId: project._id || undefined,
      source: "prime_brochure_preview",
      metadata: { title: project.title, brochureUrl: brochure.url },
    });

    window.open(brochure.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <section className="py-10">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div style={{ color, borderLeft: `5px solid ${color}` }}>
            <div className="ml-2">
              <h1 className="text-[20px] font-bold lg:text-2xl md:text-4xl">
                Brochure Preview
              </h1>
              <p className="headingDesc text-xs lg:text-base md:text-lg">
                View the project brochure before downloading
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBrochureDownload}
            className="hidden shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition sm:inline-flex"
            style={{ backgroundColor: color }}
          >
            <HiArrowDownTray className="h-4 w-4" />
            Download Brochure
          </button>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#f4f6f5] p-3 sm:p-5">
            {isPdf ? (
              <div className="bg-[#e9ecef] p-2 sm:p-4">
                <div className="mx-auto h-[540px] max-w-4xl overflow-hidden rounded-sm bg-white shadow-md sm:h-[640px]">
                  <iframe
                    src={previewUrl}
                    title="Brochure PDF preview"
                    className="h-full w-full border-0"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-center shadow-sm">
                <HiDocumentText className="h-10 w-10 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Brochure preview is available after downloading the file.
                </p>
                <button
                  type="button"
                  onClick={handleBrochureDownload}
                  className="mt-3 text-sm font-semibold"
                  style={{ color }}
                >
                  Download Brochure
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {showLoginDialog && (
        <LoginDialog
          open
          onClose={() => setShowLoginDialog(false)}
          onSwitchToRegister={() => {
            setShowLoginDialog(false);
            setShowRegisterDialog(true);
          }}
        />
      )}

      {showRegisterDialog && (
        <RegisterDialog
          open
          onClose={() => setShowRegisterDialog(false)}
          onSwitchToLogin={() => {
            setShowRegisterDialog(false);
            setShowLoginDialog(true);
          }}
        />
      )}
    </>
  );
}
