"use client";

import { useState, useEffect, type MouseEvent } from "react";
import Image from "next/image";
import { FiImage, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { GalleryItem } from "@/types/agricultural";
import { getUserShortlist, me, postShortlistProperty, removeShortlistProperty } from "@/data/ClientData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { createPortal } from "react-dom";
import { IoIosShareAlt } from "react-icons/io";

type GalleryFileProps = {
  gallery?: GalleryItem[];
  title?: string;
  propertyId?: string;
  propertyType?: "Residential" | "Commercial" | "Agricultural" | "Land";
};

const GalleryFile: React.FC<GalleryFileProps> = ({
  gallery = [],
  title,
  propertyId,
  propertyType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });
  const user = userData?.user;

  const { data: shortlistData } = useQuery({
    queryKey: ["user-shortlist"],
    queryFn: getUserShortlist,
    enabled: !!user && !!propertyId,
  });

  useEffect(() => {
    if (!propertyId || !shortlistData?.data) {
      setIsShortlisted(false);
      return;
    }
    const isInList = shortlistData.data.some(
      (item: any) => item.property?._id === propertyId,
    );
    setIsShortlisted(isInList);
  }, [shortlistData, propertyId]);

  const addShortlistMutation = useMutation({
    mutationFn: postShortlistProperty,
    onSuccess: () => {
      toast.success("Added to shortlist");
    },
    onMutate: async () => {
      if (!propertyId) return {};
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);
      queryClient.setQueryData(["user-shortlist"], (old: any) => {
        const oldData = old?.data || [];
        const alreadyExists = oldData.some(
          (item: any) => item.property?._id === propertyId,
        );
        if (alreadyExists) return old;
        return {
          ...old,
          data: [...oldData, { property: { _id: propertyId } }],
        };
      });
      return { previousShortlist };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousShortlist) {
        queryClient.setQueryData(["user-shortlist"], context.previousShortlist);
      }
      toast.error("Failed to add to shortlist.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
    },
  });

  const removeShortlistMutation = useMutation({
    mutationFn: removeShortlistProperty,
    onSuccess: () => {
      toast.success("Removed from shortlist");
    },
    onMutate: async (targetPropertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);
      queryClient.setQueryData(["user-shortlist"], (old: any) => ({
        ...old,
        data: (old?.data || []).filter(
          (item: any) => item.property?._id !== targetPropertyId,
        ),
      }));
      return { previousShortlist };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousShortlist) {
        queryClient.setQueryData(["user-shortlist"], context.previousShortlist);
      }
      toast.error("Failed to remove from shortlist.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
    },
  });

  const isShortlistLoading =
    addShortlistMutation.isPending || removeShortlistMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openLightbox = (index = 0) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
    setPreviewIndex(null);
  };

  const handleToggleShortlist = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!propertyId || !propertyType) {
      toast.error("Unable to shortlist this property.");
      return;
    }

    if (isShortlisted) {
      setIsShortlisted(false);
      removeShortlistMutation.mutate(propertyId);
      return;
    }

    setIsShortlisted(true);
    addShortlistMutation.mutate({
      propertyId,
      propertyType,
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    const shareData = {
      title: title || "Property Listing",
      text: "Check out this property!",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Ensure gallery is an array and filter out any items that don't have a URL.
  const safeGallery = (gallery || []).filter(item => item && item.url);

  // The grid layout requires at least 3 images.
  if (safeGallery.length < 3) {
    return (
      <div className="flex items-center justify-center h-[270px] sm:h-80 bg-gray-100 rounded-2xl text-gray-500">
        Not enough images to display gallery
      </div>
    );
  }

  return (
    <>
      <div className="relative grid h-[270px] grid-cols-[7fr_5fr] grid-rows-2 gap-3 rounded-md p-2 sm:h-80">

        {/* LEFT TOP (70%) */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-2xl"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={safeGallery[0].url}
            alt={safeGallery[0].filename ?? title ?? "Property image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
          />
        </div>

        {/* RIGHT TALL (30%) */}
        <div
          className="relative row-span-2 cursor-pointer overflow-hidden rounded-2xl"
          onClick={() => openLightbox(1)}
        >
          <Image
            src={safeGallery[1].url}
            alt={safeGallery[1].filename ?? title ?? "Preview image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* LEFT BOTTOM (70%) */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-2xl"
          onClick={() => openLightbox(2)}
        >
          <Image
            src={safeGallery[2].url}
            alt={safeGallery[2].filename ?? title ?? "Preview image"}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* IMAGE COUNT */}
        <div className="absolute left-6 top-6 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-sm">
          <FiImage className="h-4 w-4" />
          {safeGallery.length}
        </div>
              
        {/* ACTION ICONS */}
        <div className="absolute right-6 top-6 flex gap-2">
          <button
            type="button"
            onClick={handleToggleShortlist}
            disabled={isShortlistLoading}
            title={isShortlisted ? "Remove from shortlist" : "Shortlist"}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition ${isShortlistLoading ? "opacity-70" : ""
              }`}
          >
            {isShortlistLoading ? (
              <span className="h-4 w-4 animate-pulse rounded-full bg-gray-300" />
            ) : isShortlisted ? (
              <GoHeartFill className="h-4 w-4 text-red-500" />
            ) : (
              <GoHeart className="h-4 w-4 text-gray-700" />
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow cursor-pointer"
          >
            <IoIosShareAlt className="h-4 w-4" />
          </button>
        </div>
      </div>


      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-99 flex flex-col bg-black/95 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 bg-[#1fab60] p-2 sm:gap-4 sm:p-3">

            <button
              className="rounded-full bg-white/10 p-1.5 sm:p-2 text-white transition hover:bg-white/20 border border-white/50"
              onClick={closeLightbox}
            >
              <FiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-white truncate">
              {title}
            </h2>

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            <div className="mx-auto w-full max-w-6xl">
              {/* <div className="mb-4 flex items-center justify-between gap-3 text-white">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium sm:text-base">
                    {title ?? "Property gallery"}
                  </h3>
                  <p className="text-xs text-white/55">
                    {safeGallery.length} images
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/14"
                  onClick={() => setPreviewIndex(activeIndex)}
                >
                  Open
                </button>
              </div> */}

              <div className="columns-2 gap-3 sm:columns-2 lg:columns-3 xl:columns-4 [&>button]:mb-3">
                {safeGallery.map((item, index) => {
                  const isActive = activeIndex === index;

                  return (
                    <button
                      type="button"
                      key={`${item.key ?? item.url}-${index}`}
                      className={`group relative block w-full break-inside-avoid overflow-hidden rounded-2xl border bg-neutral-950 text-left transition duration-300 ${
                        index % 5 === 0
                          ? "min-h-60 sm:min-h-80"
                          : index % 5 === 1
                            ? "min-h-[180px] sm:min-h-[220px]"
                            : index % 5 === 2
                              ? "min-h-[280px] sm:min-h-[360px]"
                              : index % 5 === 3
                                ? "min-h-[200px] sm:min-h-[260px]"
                                : "min-h-[230px] sm:min-h-[300px]"
                      } ${
                        isActive
                          ? "border-[#1fab60]/80 ring-1 ring-[#1fab60]/50"
                          : "border-white/8 hover:border-white/20"
                      }`}
                      onClick={() => {
                        setActiveIndex(index);
                        setPreviewIndex(index);
                      }}
                    >
                      <Image
                        src={item.url}
                        alt={item.filename ?? title ?? "Preview image"}
                        fill
                        sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        priority={index === activeIndex || index < 2}
                      />

                      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Single Image Preview Overlay */}
          {previewIndex !== null && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/95">
              <button
                className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                onClick={() => setPreviewIndex(null)}
              >
                <FiX className="h-6 w-6" />
              </button>

              <button
                className="absolute left-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev !== null ? (prev + safeGallery.length - 1) % safeGallery.length : null));
                }}
              >
                <FiChevronLeft className="h-8 w-8" />
              </button>

              <div className="relative h-[85vh] w-[85vw]">
                <Image
                  src={safeGallery[previewIndex].url}
                  alt={safeGallery[previewIndex].filename ?? title ?? "Preview image"}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <button
                className="absolute right-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev !== null ? (prev + 1) % safeGallery.length : null));
                }}
              >
                <FiChevronRight className="h-8 w-8" />
              </button>
            </div>
          )}
        </div>
      )}

      {showLoginDialog &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
            <LoginDialog
              open
              onClose={() => setShowLoginDialog(false)}
              onSwitchToRegister={() => {
                setShowLoginDialog(false);
                setShowRegisterDialog(true);
              }}
            />
          </div>,
          document.body,
        )}

      {showRegisterDialog &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
            <RegisterDialog
              open
              onClose={() => setShowRegisterDialog(false)}
              onSwitchToLogin={() => {
                setShowRegisterDialog(false);
                setShowLoginDialog(true);
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
};

export default GalleryFile;
