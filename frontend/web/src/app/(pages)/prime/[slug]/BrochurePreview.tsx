"use client";

import ContactSeller from "@/app/(pages)/project/[slug]/ContactSeller";
import { trackProjectBrochureDownload } from "@/data/ClientData";
import { trackInteraction } from "@/services/trackingService";
import { FeaturedProject } from "@/types";
import Cookies from "js-cookie";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowsPointingIn,
  HiArrowsPointingOut,
  HiChevronLeft,
  HiChevronRight,
  HiDocumentText,
} from "react-icons/hi2";

type BrochurePreviewProps = {
  project: FeaturedProject;
};

type ReactPdfModule = typeof import("react-pdf");

export default function BrochurePreview({ project }: BrochurePreviewProps) {
  const brochure = project.brochure;
  const color = project.color?.trim() || "#27AE60";
  const pdfViewerRef = useRef<HTMLDivElement | null>(null);
  const pdfScrollerRef = useRef<HTMLDivElement | null>(null);

  const [showContactDialog, setShowContactDialog] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPageWidth, setPdfPageWidth] = useState(320);
  const [pdfPageHeight, setPdfPageHeight] = useState(468);
  const [pdfViewportWidth, setPdfViewportWidth] = useState(320);
  const [pdfError, setPdfError] = useState("");
  const [pdfModule, setPdfModule] = useState<Pick<
    ReactPdfModule,
    "Document" | "Page"
  > | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewHeight = isFullscreen ? "calc(100vh - 40px)" : "min(500px, 70vh)";
  const isMobileViewport = pdfViewportWidth < 640;
  const pdfRenderWidth = isMobileViewport
    ? Math.max(220, pdfViewportWidth - (isFullscreen ? 32 : 24))
    : undefined;
  const pdfRenderHeight = isMobileViewport ? undefined : pdfPageHeight;

  const isPdf =
    brochure?.mimetype?.toLowerCase().includes("pdf") ||
    brochure?.url?.toLowerCase().includes(".pdf");
  const pdfPreviewUrl = useMemo(() => {
    if (!brochure?.url || !isPdf) return "";

    return `/api/pdf-proxy?url=${encodeURIComponent(brochure.url)}`;
  }, [brochure?.url, isPdf]);

  useEffect(() => {
    let isMounted = true;

    import("react-pdf")
      .then((module) => {
        module.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        if (!isMounted) return;

        setPdfModule({
          Document: module.Document,
          Page: module.Page,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setPdfError("PDF preview library could not be loaded.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const scroller = pdfScrollerRef.current;
    if (!scroller || !isPdf) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const isMobileWidth = width < 640;
      const horizontalPadding = width >= 640 ? 96 : 24;
      const viewerHeight = isFullscreen
        ? window.innerHeight - 40
        : Math.min(500, window.innerHeight * 0.7);
      const controlsHeight = isFullscreen ? 0 : 52;
      const progressHeight = 4;
      const verticalPadding = isFullscreen ? 24 : isMobileWidth ? 40 : 56;
      const nextPageHeight = Math.max(
        260,
        viewerHeight - controlsHeight - progressHeight - verticalPadding,
      );
      setPdfViewportWidth(width);
      setPdfPageWidth(Math.max(260, Math.min(860, width - horizontalPadding)));
      setPdfPageHeight(nextPageHeight);
    });

    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, [isFullscreen, isPdf]);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    const scroller = pdfScrollerRef.current;
    if (!scroller || !numPages) return;

    const frameId = window.requestAnimationFrame(() => {
      scroller.scrollTo({
        left: (currentPage - 1) * scroller.clientWidth,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentPage, isFullscreen, numPages, pdfViewportWidth]);

  const scrollToPdfPage = (pageNumber: number) => {
    const scroller = pdfScrollerRef.current;
    if (!scroller) return;

    const nextPage = Math.min(Math.max(pageNumber, 1), numPages || 1);

    scroller.scrollTo({
      left: (nextPage - 1) * scroller.clientWidth,
      behavior: "smooth",
    });
    setCurrentPage(nextPage);
  };

  const handlePdfScroll = () => {
    const scroller = pdfScrollerRef.current;
    if (!scroller || !numPages || !scroller.clientWidth) return;

    const nextPage =
      Math.round(scroller.scrollLeft / scroller.clientWidth) + 1;
    setCurrentPage(Math.min(Math.max(nextPage, 1), numPages));
  };

  const handlePdfKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToPdfPage(currentPage - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToPdfPage(currentPage + 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((current) => !current);
  };

  const DocumentComponent = pdfModule?.Document;
  const PageComponent = pdfModule?.Page;

  if (!brochure?.url) return null;

  const handleBrochureDownload = async () => {
    const token = Cookies.get("token")?.trim();

    if (!token) {
      setShowContactDialog(true);
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
      source: "prime_brochure_preview",
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
          {/* =========================
              PREVIEW AREA
          ========================== */}
          <div className="bg-[#f4f6f5] p-3 sm:p-5">
            {isPdf ? (
              <div
                className={`overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm ${
                  isFullscreen ? "fixed inset-0 z-50 border-0 bg-[#252525] p-0 shadow-none" : ""
                }`}
              >
                {/* =========================
                    PDF VIEWER
                ========================== */}
                <div
                  ref={pdfViewerRef}
                  className={`relative overflow-hidden rounded-md border border-slate-300 bg-[#252525] shadow-[0_10px_30px_rgba(15,23,42,0.16)] ${
                    isFullscreen
                      ? "h-full w-full rounded-none border-0 shadow-none"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleBrochureDownload}
                    className={`absolute z-20 inline-flex items-center justify-center text-white shadow-[0_12px_32px_rgba(39,174,96,0.35)] transition hover:opacity-90 ${
                      isFullscreen
                        ? "bottom-24 left-4 h-11 w-11 rounded-full sm:bottom-60 sm:left-40 sm:h-13 sm:w-13 sm:translate-y-1/2"
                        : "bottom-20 left-4 h-10 w-10 rounded-full sm:bottom-36 sm:left-15 sm:h-12 sm:w-12"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label="Download brochure"
                  >
                    <HiArrowDownTray className={isFullscreen ? "h-6 w-6" : "h-6 w-6"} />
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition hover:bg-black/60"
                    aria-label={isFullscreen ? "Exit fullscreen brochure preview" : "Open brochure preview in fullscreen"}
                  >
                    {isFullscreen ? (
                      <HiArrowsPointingIn className="h-5 w-5" />
                    ) : (
                      <HiArrowsPointingOut className="h-5 w-5" />
                    )}
                  </button>

                  {isFullscreen ? (
                    <>
                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 sm:left-6 sm:h-12 sm:w-12"
                        aria-label="Previous brochure page"
                      >
                        <HiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage + 1)}
                        disabled={!numPages || currentPage >= numPages}
                        className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md transition hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-30 sm:right-6 sm:h-12 sm:w-12"
                        aria-label="Next brochure page"
                      >
                        <HiChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>

                      <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white shadow-md sm:bottom-10 sm:px-4 sm:py-2 sm:text-sm">
                        {currentPage}
                        {numPages ? ` of ${numPages}` : ""}
                      </div>
                    </>
                  ) : null}

                  <div
                    ref={pdfScrollerRef}
                    onScroll={handlePdfScroll}
                    onKeyDown={handlePdfKeyDown}
                    tabIndex={0}
                    className={`relative no-scrollbar w-full overflow-x-auto overflow-y-hidden bg-[#252525] outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-offset-2 [scroll-snap-type:x_mandatory] ${
                      isFullscreen ? "rounded-t-2xl" : ""
                    }`}
                    style={{ height: previewHeight }}
                    aria-label="Horizontal brochure PDF pages. Use left and right arrow keys to change pages."
                  >
                    {DocumentComponent && PageComponent ? (
                      <DocumentComponent
                        key={pdfPreviewUrl}
                        file={pdfPreviewUrl}
                        loading={
                          <div
                            className="flex items-center justify-center text-sm font-medium text-white/80"
                            style={{ height: previewHeight }}
                          >
                            Loading brochure...
                          </div>
                        }
                        error={
                          <div
                            className="flex items-center justify-center px-4 text-center text-sm font-medium text-white/80"
                            style={{ height: previewHeight }}
                          >
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
                          setCurrentPage(1);
                        }}
                        onLoadError={(error) => {
                          setPdfError(error.message);
                        }}
                      >
                        <div
                          className="flex w-max items-center overflow-y-hidden"
                          style={{ height: previewHeight }}
                        >
                          {Array.from({ length: numPages }, (_, pageIndex) => (
                            <div
                              key={pageIndex + 1}
                              className={`flex shrink-0 items-center justify-center overflow-hidden [scroll-snap-align:start] ${
                                isFullscreen ? "px-6 py-4" : "px-4 py-4"
                              }`}
                              style={{
                                height: previewHeight,
                                width: pdfViewportWidth,
                              }}
                            >
                              <PageComponent
                                pageNumber={pageIndex + 1}
                                width={pdfRenderWidth}
                                height={pdfRenderHeight}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                className="max-w-full overflow-hidden bg-white shadow-md"
                                loading={
                                  <div
                                    className="flex items-center justify-center bg-white text-xs font-medium text-slate-500"
                                    style={{
                                      height: pdfRenderHeight ?? pdfPageHeight,
                                      width: pdfRenderWidth ?? pdfPageWidth,
                                    }}
                                  >
                                    Loading page...
                                  </div>
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </DocumentComponent>
                    ) : (
                      <div
                        className="flex items-center justify-center text-sm font-medium text-white/80"
                        style={{ height: previewHeight }}
                      >
                        Loading brochure...
                      </div>
                    )}
                  </div>

                  <div className="h-1 w-full bg-[#1f2a37]">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        backgroundColor: color,
                        width: numPages ? `${(currentPage / numPages) * 100}%` : "0%",
                      }}
                    />
                  </div>

                  {!isFullscreen ? (
                    <div className="flex items-center justify-center gap-3 bg-[#252525] px-4 py-3 text-white">
                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="inline-flex h-7 w-7 items-center justify-center text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Previous brochure page"
                      >
                        <HiChevronLeft className="h-4 w-4" />
                      </button>

                      <p className="min-w-[64px] text-center text-sm font-semibold">
                        {currentPage}
                        {numPages ? ` of ${numPages}` : ""}
                      </p>

                      <button
                        type="button"
                        onClick={() => scrollToPdfPage(currentPage + 1)}
                        disabled={!numPages || currentPage >= numPages}
                        className="inline-flex h-7 w-7 items-center justify-center text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Next brochure page"
                      >
                        <HiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
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
                  className="mt-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ color }}
                >
                  Download Brochure
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {showContactDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowContactDialog(false)}
        >
          <div
            className="relative w-full max-w-[420px] overflow-visible"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Contact seller"
          >
            <div className="max-h-[90vh] overflow-y-auto rounded-md bg-white shadow-2xl">
              <ContactSeller
                project={project}
                isModal
                onClose={() => setShowContactDialog(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
