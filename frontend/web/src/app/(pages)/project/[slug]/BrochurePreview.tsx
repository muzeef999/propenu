"use client";

import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { trackProjectBrochureDownload } from "@/data/ClientData";
import { trackInteraction } from "@/services/trackingService";
import { FeaturedProject } from "@/types";
import Cookies from "js-cookie";
import { useState } from "react";
import { HiArrowDownTray, HiDocumentText } from "react-icons/hi2";

type BrochurePreviewProps = {
  project: FeaturedProject;
};

export default function BrochurePreview({
  project,
}: BrochurePreviewProps) {
  const brochure = project.brochure;

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  if (!brochure?.url) return null;

  const isPdf =
    brochure.mimetype?.toLowerCase().includes("pdf") ||
    brochure.url.toLowerCase().includes(".pdf");

  /**
   * PDF preview settings
   *
   * page=1
   *    Start from first page.
   *
   * zoom=page-fit
   *    Fit the complete PDF page inside the viewer.
   *
   * toolbar=0
   *    Hide PDF toolbar.
   *
   * navpanes=0
   *    Hide PDF navigation pane.
   *
   * scrollbar=1
   *    Keep scrolling enabled for multiple pages.
   */
  const previewUrl = isPdf
  ? `${brochure.url}#page=1&zoom=85&toolbar=0&navpanes=0&scrollbar=1`
  : brochure.url;

  const handleBrochureDownload = async () => {
    const token = Cookies.get("token")?.trim();

    // User is not logged in
    if (!token) {
      setShowRegisterDialog(false);
      setShowLoginDialog(true);
      return;
    }

    // Track brochure download
    if (project._id) {
      try {
        await trackProjectBrochureDownload(project._id);
      } catch {
        // Do not block download if tracking fails.
      }
    }

    // Track user interaction
    trackInteraction({
      eventType: "brochure_downloaded",
      eventCategory: "conversion",
      entityType: "project",
      projectId: project._id || undefined,
      source: "project_brochure_preview",
      metadata: {
        title: project.title,
        brochureUrl: brochure.url,
      },
    });

    // Open brochure
    window.open(
      brochure.url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <section
        id="brochure-preview"
        className="scroll-mt-20"
      >
        <div className="container mx-auto px-1 sm:px-4 lg:px-3">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">

            {/* =========================
                HEADER
            ========================== */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
              <h2 className="text-lg font-medium text-slate-950 sm:text-xl">
                Brochure Preview
              </h2>

              <button
                type="button"
                onClick={handleBrochureDownload}
                className="inline-flex w-fit items-center gap-2 rounded-md bg-[#27AE60] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803D]"
              >
                <HiArrowDownTray className="h-4 w-4" />

                Download Brochure
              </button>
            </div>

            {/* =========================
                PREVIEW AREA
            ========================== */}
            <div className="bg-[#f4f6f5] p-3 sm:p-5">

              {isPdf ? (
                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">

                  {/* =========================
                      PREVIEW TITLE
                  ========================== */}
                  <div className="border-b border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Brochure
                    </p>

                    <p className="text-xs text-slate-500">
                      Embedded brochure preview
                    </p>
                  </div>

                  {/* =========================
                      PDF VIEWER
                  ========================== */}
                  <div className="bg-[#eef2f6] p-3 sm:p-5">
                    <div
                      className="
                        mx-auto
                        w-full
                        max-w-5xl
                        overflow-hidden
                        rounded-md
                        border
                        border-slate-300
                        bg-[#252525]
                        shadow-[0_10px_30px_rgba(15,23,42,0.16)]
                      "
                    >
                      <iframe
                        key={previewUrl}
                        src={previewUrl}
                        title="Brochure PDF preview"
                        loading="lazy"
                        className="
                          block
                          h-[650px]
                          w-full
                          border-0
                          bg-[#252525]
                          sm:h-[750px]
                          lg:h-[850px]
                        "
                      />
                    </div>
                  </div>
                </div>
              ) : (

                /* =========================
                   NON PDF BROCHURE
                ========================== */
                <div className="flex h-64 flex-col items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-center shadow-sm">

                  <HiDocumentText className="h-10 w-10 text-slate-400" />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Brochure preview is available after downloading the file.
                  </p>

                  <button
                    type="button"
                    onClick={handleBrochureDownload}
                    className="mt-3 text-sm font-semibold text-[#15803D] transition hover:text-[#166534]"
                  >
                    Download Brochure
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          LOGIN DIALOG
      ========================== */}
      {showLoginDialog ? (
        <LoginDialog
          open
          onClose={() => setShowLoginDialog(false)}
          onSwitchToRegister={() => {
            setShowLoginDialog(false);
            setShowRegisterDialog(true);
          }}
        />
      ) : null}

      {/* =========================
          REGISTER DIALOG
      ========================== */}
      {showRegisterDialog ? (
        <RegisterDialog
          open
          onClose={() => setShowRegisterDialog(false)}
          onSwitchToLogin={() => {
            setShowRegisterDialog(false);
            setShowLoginDialog(true);
          }}
        />
      ) : null}
    </>
  );
}