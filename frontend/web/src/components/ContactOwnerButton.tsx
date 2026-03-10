"use client";

import { me, postLeads } from "@/data/ClientData";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { listingSourceToOwnershipLabel } from "@/utilies/resolveListingSource";

interface ContactOwnerButtonProps {
  listingType?: string;
  projectId: undefined | string;
  listingSource?: "User" | "Agent" | "builder" | string;

  propertyType?:
    | "residentials"
    | "commercials"
    | "agriculturals"
    | "landplots"
    | "featuredprojects";
  className?: string;
  children?: React.ReactNode;
}

export default function ContactOwnerButton({
  listingType,
  listingSource,

  projectId,
  propertyType = "residentials",
  className,
  children,
}: ContactOwnerButtonProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const router = useRouter();
  const normalizeListingType = (
    value?: string,
  ): "sale" | "rent" | undefined => {
    const normalized = value?.toLowerCase().trim();
    if (!normalized) return undefined;
    if (
      normalized === "sale" ||
      normalized === "sell" ||
      normalized === "buy"
    ) {
      return "sale";
    }
    if (
      normalized === "rent" ||
      normalized === "rental" ||
      normalized === "lease"
    ) {
      return "rent";
    }
    return undefined;
  };
  const resolvedListingType = normalizeListingType(listingType);

  const redirectToPlan = () => {
    if (resolvedListingType === "sale") {
      router.push("/plans/pricing/buy-view");
      return;
    }

    if (resolvedListingType === "rent") {
      router.push("/plans/pricing/rent-view");
      return;
    }

    router.push("/plans/pricing/buy-view");
  };

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });

  const getContactPerson = () => {
    return listingSourceToOwnershipLabel(listingSource);
  };

  const user = userData?.user;
  const { mutate: postLead, isPending: isLeadPosting } = useMutation({
    mutationFn: postLeads,
    onSuccess: () => {
      toast.success(`${getContactPerson()} will contact you shortly`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to contact owner";

      // 🔐 Buyer plan required → redirect ONLY (no toast)
      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("purchase") ||
        lowerMessage.includes("plan required") ||
        lowerMessage.includes("subscribe") ||
        lowerMessage.includes("subscription")
      ) {
        redirectToPlan();
        return;
      }

      // ❌ Show toast for all other errors
      toast.error(message);
    },
  });

  const handleContactOwner = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    if (!projectId) {
      toast.error("Property ID missing");
      return;
    }

    postLead({
      name: user.name || "Guest User",
      phone: user.phone,
      email: user.email ?? undefined, // ✅ FIXED
      projectId,
      propertyType,
      listingType: resolvedListingType,
      remarks: "Interested in this property",
    });
  };

  return (
    <>
      <button
        onClick={handleContactOwner}
        disabled={isLeadPosting || isLoadingUser}
        className={
          className ??
          "rounded btn-primary px-6 py-2 font-medium text-white disabled:cursor-not-allowed transition-opacity"
        }
      >
        {children ??
          (isLeadPosting ? "Sending..." : `Contact ${getContactPerson()}`)}
      </button>

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
}
