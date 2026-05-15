"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/Redux/store";
import VerifyProperty from "../verifyproperty/VerifyProperty";
import TrackPropertyStatus from "../verifyproperty/TrackPropertyStatus";

const VerificationStep = () => {
  const router = useRouter();
  const { residential, commercial, land, agricultural, propertyType, base } =
    useAppSelector((state) => state.postProperty);

  const profileData =
    propertyType === "residential"
      ? residential
      : propertyType === "commercial"
        ? commercial
        : propertyType === "land"
          ? land
          : agricultural;

  const [submissionMeta, setSubmissionMeta] = useState<{
    isSubmitted: boolean;
    isApproved: boolean;
    submittedAt?: string;
    reviewAt?: string;
    approvedAt?: string;
  } | null>(null);

  /* =========================================
     FALLBACK DATA (From Draft)
  ========================================= */

  const fallbackHasDocs = Array.isArray(profileData?.verificationDocuments)
    ? profileData.verificationDocuments.length > 0
    : false;

  const fallbackApproved = Array.isArray(profileData?.verificationDocuments)
    ? profileData.verificationDocuments.some(
        (doc: any) => doc?.status === "verified"
      )
    : false;

  const trackerState = submissionMeta ?? {
    isSubmitted: fallbackHasDocs,
    isApproved: fallbackApproved,
    submittedAt: base?.createdAt,
    reviewAt: base?.updatedAt,
    approvedAt: fallbackApproved ? base?.updatedAt : undefined,
  };

  const showTracker = trackerState.isSubmitted;
  const listingSource = String(
    base?.listingSource ?? profileData?.listingSource ?? ""
  ).toLowerCase();
  const myPropertiesRoute =
    listingSource === "agent" ? "/agent/my-properties" : "/my-properties";

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="space-y-8">
      {/* Header (Hide when tracker is open) */}
      {!showTracker && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Verification & Compliance
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete the verification process to improve your property's trust and visibility
          </p>
        </div>
      )}

      {/* Verification Content */}
      <div className="">
        {showTracker ? (
          <TrackPropertyStatus
            isApproved={trackerState.isApproved}
            submittedAt={trackerState.submittedAt}
            reviewAt={trackerState.reviewAt}
            approvedAt={trackerState.approvedAt}
            onGoToMyProperties={() => router.push(myPropertiesRoute)}
          />
        ) : (
          <VerifyProperty onVerificationSubmitted={setSubmissionMeta} />
        )}
      </div>
    </div>
  );
};

export default VerificationStep;
