"use client";

import { me, postLeads } from "@/data/ClientData";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import LoginDialog from "@/app/(auth)/Login";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface ContactOwnerButtonProps {
  projectId: undefined | string;
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
  projectId,
  propertyType = "residentials",
  className,
  children,
}: ContactOwnerButtonProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const router = useRouter();


  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });

  const user = userData?.user;
  const { mutate: postLead, isPending: isLeadPosting } = useMutation({
    mutationFn: postLeads,
    onSuccess: () => {
      toast.success("Owner will contact you shortly");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to contact owner";

      // 🔐 Buyer plan required → redirect ONLY (no toast)
      if (message.toLowerCase().includes("purchase a buyer plan")) {
        router.push("/plans/pricing/buy-view");
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
      phone: user.phone || "9959456647",
      email: user.email ?? undefined, // ✅ FIXED
      projectId,
      propertyType,
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
      {children ?? (isLeadPosting ? "Sending..." : "Contact Owner")}
    </button>


    {showLoginDialog &&
      createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
          <LoginDialog
            open
            onClose={() => setShowLoginDialog(false)}
            onSwitchToRegister={() => { }}
          />
        </div>,
        document.body
      )}

  </>
);
}
