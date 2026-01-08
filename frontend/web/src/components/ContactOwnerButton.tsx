"use client";

import { me, postLeads } from "@/data/ClientData";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ContactOwnerButtonProps {
  projectId: string;
  propertyType?:
    | "residentials"
    | "commercials"
    | "agriculturals"
    | "landplots"
    | "featuredprojects";
}

export default function ContactOwnerButton({
  projectId,
  propertyType = "residentials",
}: ContactOwnerButtonProps) {
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

      toast.error(message);
    },
  });

  const handleContactOwner = () => {
    if (!user) {
      toast.error("Please log in to contact owner");
      return;
    }

    postLead({
      name: user.name || "Guest User",
      phone: user.phone || "9959456647",
      email: user.email || "",
      projectId,
      propertyType,
      remarks: "Interested in this property",
    });
  };

  return (
    <button
      onClick={handleContactOwner}
      disabled={isLeadPosting || isLoadingUser}
      className="rounded bg-[#27AE60] px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
    >
      {isLeadPosting ? "Sending..." : "Contact Owner"}
    </button>
  );
}
