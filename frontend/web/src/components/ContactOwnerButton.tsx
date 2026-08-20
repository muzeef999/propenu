"use client";

import LeadDialog from "@/app/(pages)/properties/cards/LeadDialog";
import { me, postLeads } from "@/data/ClientData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { listingSourceToOwnershipLabel } from "@/utilies/resolveListingSource";
import { trackInteraction } from "@/services/trackingService";
import LeadAuthDialog from "@/components/LeadAuthDialog";

interface ContactOwnerButtonProps {
  listingType?: string;
  projectId: undefined | string;
  listingSource?: "User" | "Agent" | "builder" | string;
  createdBy?: Record<string, unknown>;
  propertyType?:
    | "residentials"
    | "commercials"
    | "agriculturals"
    | "landplots"
    | "featuredprojects";
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  postedOn?: string | Date;
  price?: number | string;
  propertyLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

function normalizeComparableValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function sanitizePhoneInput(value?: string | null) {
  const cleaned = String(value || "").replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    return cleaned.replace(/\+/g, "");
  }

  return `+${cleaned.slice(1).replace(/\+/g, "")}`;
}

function getEntityId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const entity = value as { _id?: string; id?: string };
    return entity._id?.trim() || entity.id?.trim() || "";
  }
  return "";
}

function isLeadReadyUser(user?: any) {
  if (!user) return false;

  const hasVerifiedPhone =
    user.phoneVerified !== false && Boolean(String(user.phone || "").trim());
  const hasName = Boolean(String(user.name || "").trim());
  const hasRole = Boolean(String(user.roleName || user.role || "").trim());
  const builderNeedsCompany =
    (user.roleName || user.role) !== "builder" ||
    Boolean(String(user.companyName || "").trim());

  return hasVerifiedPhone && hasName && hasRole && builderNeedsCompany;
}

function isPlanRestrictionError(statusCode?: number, message?: string) {
  const lowerMessage = String(message || "").toLowerCase();

  const hasPlanRestrictionMessage =
    lowerMessage.includes("plan required") ||
    lowerMessage.includes("subscription required") ||
    lowerMessage.includes("upgrade your plan") ||
    lowerMessage.includes("please purchase") ||
    lowerMessage.includes("buy a plan") ||
    lowerMessage.includes("purchase a plan") ||
    lowerMessage.includes("purchase a buyer plan") ||
    lowerMessage.includes("subscribe to a plan") ||
    lowerMessage.includes("active plan") ||
    lowerMessage.includes("membership required") ||
    lowerMessage.includes("plan limit");

  return statusCode === 402 || statusCode === 403 || hasPlanRestrictionMessage;
}

export default function ContactOwnerButton({
  listingType,
  listingSource,
  createdBy,
  projectId,
  propertyType = "residentials",
  ownerName,
  ownerPhone,
  ownerEmail,
  postedOn,
  price,
  propertyLabel,
  className,
  children,
}: ContactOwnerButtonProps) {
  const [showLeadAuthDialog, setShowLeadAuthDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const justAuthenticatedRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();

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
    return listingSourceToOwnershipLabel(listingSource, createdBy);
  };

  const user = userData?.user;
  const isLeadReady = isLeadReadyUser(user);
  const createdById = getEntityId(createdBy);
  const normalizedOwnerPhone = sanitizePhoneInput(ownerPhone);
  const normalizedOwnerEmail = normalizeComparableValue(ownerEmail);

  const isOwnLeadForUser = (currentUser?: any) => {
    const currentUserId = getEntityId(currentUser);
    const currentUserPhone = sanitizePhoneInput(currentUser?.phone);
    const currentUserEmail = normalizeComparableValue(currentUser?.email);

    return (
      Boolean(currentUser) &&
      ((Boolean(currentUserId) &&
        Boolean(createdById) &&
        currentUserId === createdById) ||
        (Boolean(currentUserPhone) &&
          Boolean(normalizedOwnerPhone) &&
          currentUserPhone === normalizedOwnerPhone) ||
        (Boolean(currentUserEmail) &&
          Boolean(normalizedOwnerEmail) &&
          currentUserEmail === normalizedOwnerEmail))
    );
  };

  const isOwnPropertyLead = isOwnLeadForUser(user);
  const ownPropertyLeadMessage =
    propertyType === "featuredprojects"
      ? "You cannot submit a lead for your own project."
      : "You cannot submit a lead for your own property.";

  const { mutateAsync: postLead, isPending: isLeadPosting } = useMutation({
    mutationFn: postLeads,
    onSuccess: (response) => {
      trackInteraction({
        eventType: "contact_owner_clicked",
        eventCategory: "conversion",
        entityType:
          propertyType === "featuredprojects" ? "project" : "property",
        ...(propertyType === "featuredprojects"
          ? { projectId }
          : { propertyId: projectId }),
        source: "contact_owner",
        metadata: {
          title: propertyLabel,
          propertyType,
          listingType: resolvedListingType,
        },
      });
      setLeadDetails(response?.data ?? null);
      setShowLeadDialog(true);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to contact owner";
      const statusCode = error?.response?.status;

      if (isPlanRestrictionError(statusCode, message)) {
        toast.error(
          justAuthenticatedRef.current
            ? "Your account is ready. To contact this owner, please choose a plan."
            : message,
        );
        justAuthenticatedRef.current = false;
        redirectToPlan();
        return;
      }

      justAuthenticatedRef.current = false;
      toast.error(message);
    },
  });

  const submitLeadForUser = async (currentUser: any) => {
    if (isOwnLeadForUser(currentUser)) {
      toast.error(ownPropertyLeadMessage);
      return;
    }

    if (!projectId) {
      toast.error("Property ID missing");
      return;
    }

    trackInteraction({
      eventType: "lead_form_started",
      eventCategory: "conversion",
      entityType: propertyType === "featuredprojects" ? "project" : "property",
      ...(propertyType === "featuredprojects"
        ? { projectId }
        : { propertyId: projectId }),
      source: "contact_owner",
      metadata: {
        title: propertyLabel,
        propertyType,
        listingType: resolvedListingType,
      },
    });

    await postLead({
      name: currentUser?.name || "Guest User",
      phone: currentUser?.phone,
      email: currentUser?.email ?? undefined,
      projectId,
      propertyType,
      listingType: resolvedListingType,
      remarks: "Interested in this property",
    });
    justAuthenticatedRef.current = false;
  };

  const handleContactOwner = () => {
    if (!isLeadReady) {
      setShowLeadAuthDialog(true);
      return;
    }

    if (isOwnPropertyLead) {
      toast.error(ownPropertyLeadMessage);
      return;
    }

    if (!projectId) {
      toast.error("Property ID missing");
      return;
    }

    void submitLeadForUser(user);
  };

  return (
    <>
      <button
        onClick={handleContactOwner}
        disabled={isLeadPosting || isLoadingUser || isOwnPropertyLead}
        className={
          className ??
          "rounded btn-primary px-6 py-2 font-medium text-white disabled:cursor-not-allowed transition-opacity"
        }
      >
        {children ??
          (isLeadPosting ? "Sending..." : `Contact ${getContactPerson()}`)}
      </button>

      {showLeadAuthDialog &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
            <LeadAuthDialog
              open
              onClose={() => setShowLeadAuthDialog(false)}
              initialPhone={user?.phone}
              initialPlanCategory={
                resolvedListingType === "rent" ? "rent_view" : "buy"
              }
              onAuthSuccess={async (authenticatedUser) => {
                justAuthenticatedRef.current = true;
                await queryClient.invalidateQueries({ queryKey: ["user"] });
                await submitLeadForUser(authenticatedUser);
              }}
            />
          </div>,
          document.body,
        )}

      {showLeadDialog &&
        createPortal(
          <LeadDialog
            open={showLeadDialog}
            onClose={() => setShowLeadDialog(false)}
            ownerName={ownerName ?? leadDetails?.ownerId?.name}
            ownerRole={getContactPerson()}
            phone={ownerPhone ?? leadDetails?.ownerId?.phone}
            email={ownerEmail ?? leadDetails?.ownerId?.email}
            postedOn={postedOn ?? leadDetails?.projectId?.createdAt}
            price={
              price ??
              leadDetails?.projectId?.price ??
              leadDetails?.projectId?.priceFrom ??
              leadDetails?.projectId?.priceTo
            }
            propertyLabel={propertyLabel ?? leadDetails?.projectId?.title}
          />,
          document.body,
        )}
    </>
  );
}
