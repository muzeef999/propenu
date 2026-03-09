"use client";
import React, { useState } from "react";
import {
  Furnishing,
  Steps,
  SuperBuiitupAraea,
  UnderConstruction,
} from "@/icons/icons";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import Link from "next/link";
import { AiOutlineHeart } from "react-icons/ai";
import { BiBuildingHouse } from "react-icons/bi";
import { ICommercial } from "@/types/commercial";
import ImageAutoCarousel from "@/ui/ImageAutoCarousel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postShortlistProperty, me, removeShortlistProperty, getUserShortlist } from "@/data/ClientData";
import { toast } from "sonner";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const bgPriceColor = hexToRGBA("#27AE60", 0.1);

const bgPriceColoricon = hexToRGBA("#27AE60", 0.4);

const CommercialCard: React.FC<{ p: ICommercial; vertical?: boolean }> = ({
  p,
  vertical = false,
}) => {
  const img = p?.gallery?.[0]?.url ?? "/placeholder.jpg";
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const router = useRouter();
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
    enabled: !!user,
  });

  useEffect(() => {
    if (shortlistData?.data) {
      const isInList = shortlistData.data.some(
        (item: any) => item.property?._id === p.id
      );
      setIsShortlisted(isInList);
    }
  }, [shortlistData, p.id]);

  const addShortlistMutation = useMutation({
    mutationFn: postShortlistProperty,
    onSuccess: () => {
      toast.success("Added to shortlist");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);
      queryClient.setQueryData(["user-shortlist"], (old: any) => ({
        ...old,
        data: [...(old?.data || []), { property: { _id: p.id } }],
      }));
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
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);
      queryClient.setQueryData(["user-shortlist"], (old: any) => ({
        ...old,
        data: (old?.data || []).filter(
          (item: any) => item.property?._id !== propertyId,
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

  const pricePerSqft =
    (p as any)?.pricePerSqft ??
    Math.round((p?.price ?? 0) / (p as any)?.superBuiltUpArea || 0);

  const listingSourceRaw = (
    p?.listingSource ||
    "user"
  )
    ?.toString()
    .toLowerCase();

  const resolvedListingSource: "User" | "Agent" | "builder" =
    listingSourceRaw === "agent"
      ? "Agent"
      : listingSourceRaw === "builder"
        ? "builder"
        : "User";

  return (
    <div
      className={`card p-2 h-auto flex overflow-hidden ${
        vertical ? "flex-col" : "flex-col md:flex-row md:h-[220px]"
      }`}
    >
      <Link href={`/properties/commercial/${p.slug}`} className={`flex flex-1 min-w-0 ${vertical ? "flex-col" : "flex-col md:flex-row"}`}>
        {/* Left: image */}
        <div
          className={`rounded-xl relative shrink-0 ${vertical ? "w-full h-48" : "w-full h-48 md:w-56 md:h-full"
            }`}
        >
          <ImageAutoCarousel
            images={p?.gallery?.map((g) => g.url) ?? []}
            alt={p?.title}
            onIndexChange={setActiveImageIndex}
            isShortlisted={isShortlisted}
            isShortlistLoading={
              addShortlistMutation.isPending || removeShortlistMutation.isPending
            }
            onToggleShortlist={() => {
              if (!user) {
                router.push("/login");
                return;
              }

              // Ensure we have a valid property ID before proceeding.
              const propertyId = p.id;
              if (!propertyId) {
                toast.error("Cannot shortlist property without a valid ID.");
                return;
              }

              if (isShortlisted) {
                setIsShortlisted(false); // optimistic
                removeShortlistMutation.mutate(propertyId);
              } else {
                setIsShortlisted(true); // optimistic
                addShortlistMutation.mutate({
                  propertyId: propertyId,
                  propertyType: "Commercial",
                });
              }
            }}
          />
          {/* overlay: image count & date */}
          <div className="absolute left-2 bottom-2 flex items-center gap-2 text-xs text-white">
            <div className="bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M3 7h18M3 12h18M3 17h18"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                {activeImageIndex + 1}/{p?.gallery?.length ?? 1}
              </span>{" "}
            </div>
          </div>
        </div>

        {/* Middle: content */}
        <div className="flex-1 min-w-0 p-4 md:p-4 flex flex-col justify-between h-auto md:h-full">
          <div className={`min-w-0 flex ${vertical ? "flex-col gap-1" : "flex-col"}`}>
            <h3
              className={`font-semibold leading-snug line-clamp-2 ${vertical ? "text-base max-w-[250px] truncate" : "text-lg md:text-md max-w-[600px]"
                }`}
            >
              {p.title}
            </h3>

            <p className="mt-1 flex items-center gap-2 truncate text-sm text-gray-500">
              <BiBuildingHouse className="h-4 w-4 shrink-0" />
              {p?.buildingName}
            </p>
          </div>

          {/* badges */}
          <div
            className={`hidden ${vertical ? "" : "md:flex"} flex-wrap gap-2 mt-3`}
          >
            <span className="text-xs font-normal px-2 py-1 text-primary">
              RERA Approved
            </span>
            <span className="text-xs font-normal px-2 py-1 text-primary">
              Premium
            </span>
            <span className="text-xs font-normal px-2 py-1 text-primary">
              Zero Brokerage
            </span>
          </div>

          {/* meta icons row */}
          <div
            className={`mt-4 text-xs text-gray-600 border-t pt-4 border-gray-200 ${vertical
                ? "grid grid-cols-2 gap-4"
                : "grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
              }`}
          >
            <div className="items-center gap-2 flex">
              <SuperBuiitupAraea size={24} color={bgPriceColoricon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">
                  Built-up Area
                </div>
                <div className="font-medium">
                  {(p as any)?.builtUpArea ?? "—"} sqft
                </div>
              </div>
            </div>

            <div className="items-center gap-2 flex">
              <UnderConstruction size={24} color={bgPriceColoricon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">
                  Availability
                </div>
                <div className="font-medium">
                  {(p as any)?.constructionStatus ? "Available" : " Construction"}
                </div>
              </div>
            </div>

            <div className="items-center gap-2 flex">
              <Furnishing size={24} color={bgPriceColoricon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">
                  Furnishing
                </div>
                <div className="font-medium">
                  {(() => {
                    const furnishing = (p as any)?.furnishing;

                    if (furnishing === "fully-furnished") return "Furnished";
                    if (furnishing === "semi-furnished") return "Semi";
                    return "Unfurnished";
                  })()}
                </div>
              </div>
            </div>

            <div className="items-center gap-2 flex">
              <Steps size={24} color={bgPriceColoricon} />
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 tracking-wide">Floor</div>
                <div className="font-medium">
                  {p.floorNumber ?? "—"} / {p.totalFloors ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Right: price card */}
      <aside
        className={`rounded-xl ${
          vertical
            ? "w-full px-3 py-2 flex items-center justify-between gap-3"
            : "w-full mt-3 px-3 py-2 flex items-center justify-between gap-3 md:w-52 md:p-3 md:flex-col md:justify-center md:mt-0"
        }`}
        style={{ backgroundColor: bgPriceColor }}
      >
        {/* PRICE */}
        <div
          className={`${
            vertical
              ? "flex flex-col"
              : "flex flex-col md:items-center md:text-center"
          }`}
        >
          <div
            className={`text-green-700 font-semibold ${
              vertical
                ? "text-lg leading-tight"
                : "text-lg leading-tight md:text-2xl"
            }`}
          >
            {formatINR(p?.price)}
          </div>

          <div className="text-xs text-gray-600">₹ {pricePerSqft}/sqft</div>
        </div>

        {/* BUTTON */}
        <div
          className={`${
            vertical
              ? "shrink-0"
              : "shrink-0 md:w-full md:mt-4 flex justify-center"
          }`}
        >
          <ContactOwnerButton
            projectId={p.id}
            propertyType="commercials"
            listingType={p?.listingType}
            listingSource={resolvedListingSource}
            className={`btn-primary text-white rounded-md shadow-sm transition font-medium whitespace-nowrap ${
              vertical
                ? "px-4 py-1.5 text-sm"
                : "px-4 py-1.5 text-sm md:w-[90%] md:py-2 md:text-base "
            }`}
          />
        </div>
      </aside>
    </div>
  );
};

export default CommercialCard;
