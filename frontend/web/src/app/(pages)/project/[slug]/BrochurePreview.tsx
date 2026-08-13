"use client";

import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { trackProjectBrochureDownload } from "@/data/ClientData";
import { trackInteraction } from "@/services/trackingService";
import { FeaturedProject } from "@/types";
import Cookies from "js-cookie";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiArrowDownTray, HiDocumentText } from "react-icons/hi2";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type BrochurePreviewProps = {
  project: FeaturedProject;
};

export default function BrochurePreview({
  project,
}: BrochurePreviewProps) {
  const brochure = project.brochure;
  const pdfScrollerRef = useRef<HTMLDivElement | null>(null);

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pdfPageWidth, setPdfPageWidth] = useState(320);
  const [pdfError, setPdfError] = useState("");

  const isPdf =
    brochure?.mimetype?.toLowerCase().includes("pdf") ||
    brochure?.url?.toLowerCase().includes(".pdf");
  const pdfPreviewUrl = useMemo(() => {
    if (!brochure?.url || !isPdf) return "";

    return `/api/pdf-proxy?url=${encodeURIComponent(brochure.url)}`;
  }, [brochure?.url, isPdf]);

  useEffect(() => {
    const scroller = pdfScrollerRef.current;
    if (!scroller || !isPdf) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const horizontalPadding = width >= 640 ? 48 : 24;
      setPdfPageWidth(Math.max(260, Math.min(760, width - horizontalPadding)));
    });

    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, [isPdf]);

  if (!brochure?.url) return null;

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
                      PDF VIEWER
                  ========================== */}
                    <div
                      ref={pdfScrollerRef}
                      className="w-full overflow-x-auto overflow-y-hidden rounded-md border border-slate-300 bg-[#252525] px-3 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.16)] [scrollbar-gutter:stable] [scroll-snap-type:x_mandatory] sm:px-6 sm:py-6"
                      aria-label="Horizontal brochure PDF pages"
                    >
                      <Document
                        key={pdfPreviewUrl}
                        file={pdfPreviewUrl}
                        loading={
                          <div className="flex h-[520px] items-center justify-center text-sm font-medium text-white/80">
                            Loading brochure...
                          </div>
                        }
                        error={
                          <div className="flex h-[520px] items-center justify-center px-4 text-center text-sm font-medium text-white/80">
                            <div>
                              <p>
                                Brochure preview could not be loaded. Please use
                                the download button.
                              </p>
                              {pdfError ? (
                                <p className="mt-2 text-xs text-white/60">
                                  {pdfError}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        }
                        onLoadSuccess={({
                          numPages: loadedPages,
                        }: {
                          numPages: number;
                        }) => {
                          setPdfError("");
                          setNumPages(loadedPages);
                        }}
                        onLoadError={(error) => {
                          setPdfError(error.message);
                        }}
                      >
                        <div className="flex min-h-[520px] w-max items-start gap-4 sm:min-h-[640px] sm:gap-6 lg:min-h-[760px]">
                          {Array.from(
                            { length: numPages },
                            (_, pageIndex) => (
                              <div
                                key={pageIndex + 1}
                                className="shrink-0 [scroll-snap-align:center]"
                              >
                                <Page
                                  pageNumber={pageIndex + 1}
                                  width={pdfPageWidth}
                                  renderAnnotationLayer={false}
                                  renderTextLayer={false}
                                  className="overflow-hidden rounded-sm bg-white shadow-md"
                                  loading={
                                    <div
                                      className="flex items-center justify-center bg-white text-xs font-medium text-slate-500"
                                      style={{
                                        height: pdfPageWidth * 1.35,
                                        width: pdfPageWidth,
                                      }}
                                    >
                                      Loading page...
                                    </div>
                                  }
                                />
                              </div>
                            )
                          )}
                        </div>
                      </Document>
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
