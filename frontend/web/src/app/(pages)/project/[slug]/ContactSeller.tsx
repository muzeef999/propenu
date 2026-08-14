"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  checkProjectLeadSubmitted,
  createPublicSupportTicket,
  me,
  patchProjectLeadIntention,
  projectpostLeads,
} from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import OtpFourDigitInput from "@/components/builder/OtpFourDigitInput";
import { HiXMark } from "react-icons/hi2";

type IntentionAnswer = {
  question: string;
  answer: string;
};

const BUY_TIMELINE_QUESTION = "When do you plan to buy?";
const BUDGET_QUESTION = "Your Budget?";
const buyTimelineOptions = ["Within 30 Days", "1 - 3 Months", "3 - 6 Months", "More than 6 Months"];
const budgetOptions = ["50L - 1Cr", "1Cr - 2Cr", "2Cr+"];

type ContactSellerProps = {
  project: FeaturedProject;
  isModal?: boolean;
  onClose?: () => void;
};

type ContactLike = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  contact?: string;
  email?: string;
};

type UserProfile = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
};

type RoleConflictState = {
  message: string;
  conflictField?: "phone" | "email";
  conflictRole?: string;
  conflictDisplayRole?: string;
  conflictValue?: string;
};

type BuilderInviteApiError = {
  message: string;
  code?: string;
  conflictField?: "phone" | "email";
  conflictRole?: string;
  conflictDisplayRole?: string;
  conflictValue?: string;
};

function getUserPrefill(user?: UserProfile | null) {
  return {
    name: sanitizeNameInput(user?.name || user?.fullName || ""),
    phone: user?.phone ? sanitizePhoneInput(user.phone) : "",
    email: user?.email || "",
  };
}

function isContactObject(value: unknown): value is ContactLike {
  return Boolean(value) && typeof value === "object";
}

function normalizeComparableValue(value?: string | null) {
  return value?.trim().toLowerCase() || "";
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

function getLeadErrorMessage(error: unknown) {
  const fallback = "Failed to submit lead";
  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: string[] | Record<string, string | string[]>;
      };
    };
    message?: string;
  };

  const data = maybeAxiosError.response?.data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(", ");
  }

  if (data?.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)
      .flat()
      .find((value) => typeof value === "string" && value.trim());

    if (firstError) return firstError;
  }

  if (typeof maybeAxiosError.message === "string" && maybeAxiosError.message.trim()) {
    return maybeAxiosError.message;
  }

  return fallback;
}

function isValidPhoneNumber(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return /^\+?[1-9]\d{9,14}$/.test(normalized);
}

function sanitizePhoneInput(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    return cleaned.replace(/\+/g, "");
  }

  return `+${cleaned.slice(1).replace(/\+/g, "")}`;
}

function sanitizeNameInput(value: string) {
  return value.replace(/[^A-Za-z\s]/g, "");
}

function isValidName(value: string) {
  return /^[A-Za-z\s]+$/.test(value.trim());
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getFieldValidationMessage(
  field: HTMLInputElement | HTMLTextAreaElement,
) {
  const { name, validity } = field;

  if (validity.valueMissing) {
    if (name === "terms") return "Please accept the Terms & Conditions";
    if (name === "name") return "Please enter your full name";
    if (name === "phone") return "Please enter your mobile number";
    if (name === "email") return "Please enter your email address";
  }

  if (validity.patternMismatch) {
    if (name === "name") return "Full Name should contain letters only";
    if (name === "phone") return "Please enter a valid phone number";
    if (name === "email") return "Please enter a valid email address";
  }

  if (validity.typeMismatch && name === "email") {
    return "Please enter a valid email address";
  }

  return "Please check this field";
}

function prettifyConflictRole(value?: string) {
  if (!value) return "another";
  if (value === "user") return "User";
  if (value === "agent") return "Agent";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function parseInviteApiError(res: Response): Promise<BuilderInviteApiError> {
  const json = await res.json().catch(() => ({}));
  return {
    message:
      json?.error || json?.message || "Something went wrong. Please try again.",
    code: json?.code,
    conflictField: json?.conflictField,
    conflictRole: json?.conflictRole,
    conflictDisplayRole: json?.conflictDisplayRole,
    conflictValue: json?.conflictValue,
  };
}

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

const ContactSeller = ({ project, isModal = false, onClose }: ContactSellerProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const inviteToken = searchParams.get("invite");
  const projectStatus = String(project.status || "").toLowerCase();
  const projectAlreadyClaimed = Boolean(project.createdBy);
  const canUseInviteFlow =
    Boolean(inviteToken) &&
    projectStatus !== "active" &&
    !projectAlreadyClaimed;

  // Builder Invite Mode States
  const [isInviteMode, setIsInviteMode] = useState(canUseInviteFlow);
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteStep, setInviteStep] = useState<
    "form" | "otp" | "success" | "role_conflict" | "review_sent"
  >("form");
  const [otp, setOtp] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [builderFormError, setBuilderFormError] = useState("");
  const [roleConflict, setRoleConflict] = useState<RoleConflictState | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [showSubmittedStep, setShowSubmittedStep] = useState(false);
  const [intentionAnswers, setIntentionAnswers] = useState<IntentionAnswer[]>([]);
  const resolvedProjectId =
    (project as FeaturedProject & { id?: string })._id ||
    (project as FeaturedProject & { id?: string }).id ||
    "";

  const reviewTicketMutation = useMutation({
    mutationFn: async () =>
      createPublicSupportTicket({
        title: "Builder claim account role conflict review",
        description: [
          "A builder project claim was blocked due to an account role conflict.",
          `Project: ${project.title}`,
          `Invite token: ${inviteToken || "-"}`,
          `Contact name: ${form.name.trim()}`,
          `Phone: ${form.phone.trim() || "-"}`,
          `Email: ${form.email.trim() || "-"}`,
          `Conflict field: ${roleConflict?.conflictField || "-"}`,
          `Detected role: ${roleConflict?.conflictRole || "-"}`,
          "Reason: builder_claim_role_conflict",
        ].join("\n"),
        requester: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },
        category: "Customer Request",
        priority: "high",
        source: "web",
        metadata: {
          requestType: "builder_claim_role_conflict",
          module: "builder_invite_claim",
          relatedProjectId: resolvedProjectId,
          relatedProjectName: project.title,
          inviteToken,
          contactName: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          conflictField: roleConflict?.conflictField || null,
          conflictRole: roleConflict?.conflictRole || null,
          conflictDisplayRole: roleConflict?.conflictDisplayRole || null,
          conflictValue: roleConflict?.conflictValue || null,
        },
      }),
    onSuccess: () => {
      toast.success("Your review request has been sent to Admin.");
      setInviteStep("review_sent");
    },
    onError: (error) => {
      toast.error(getLeadErrorMessage(error));
    },
  });

  // Fetch Invite Details if inviteToken exists
  useEffect(() => {
    setIsInviteMode(canUseInviteFlow);
    if (!inviteToken || !canUseInviteFlow) return;
    (async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(inviteToken)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.data) {
          setInviteData(json.data);
          const invite = json.data?.invite;
          setForm((f) => ({
            ...f,
            email: invite?.email || f.email,
            phone: invite?.phone ? sanitizePhoneInput(invite.phone) : f.phone,
            name: invite?.companyName || invite?.contactName || f.name,
          }));
        }
      } catch (err) {
        console.error("Failed to load invite details:", err);
      }
    })();
  }, [canUseInviteFlow, inviteToken]);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });
  const loggedInUser = userData?.user as UserProfile | undefined;
  const loggedInUserId = getEntityId(loggedInUser);
  const userLeadPhone = loggedInUser?.phone
    ? sanitizePhoneInput(loggedInUser.phone)
    : "";
  const userLeadEmail = loggedInUser?.email?.trim() || "";

  const { data: existingLeadData } = useQuery({
    queryKey: ["project-lead-submitted", resolvedProjectId, userLeadPhone, userLeadEmail],
    queryFn: () =>
      checkProjectLeadSubmitted({
        projectId: resolvedProjectId,
        phone: userLeadPhone,
        email: userLeadEmail,
      }),
    enabled: Boolean(resolvedProjectId && (userLeadPhone || userLeadEmail) && !isInviteMode),
    retry: 1,
  });

  useEffect(() => {
    if (isInviteMode) return;
    const existingLead = existingLeadData?.data;
    if (!existingLeadData?.submitted || !existingLead) return;

    setLeadId(String(existingLead._id || ""));
    setIntentionAnswers(
      Array.isArray(existingLead.intention) ? existingLead.intention : [],
    );
    setShowSubmittedStep(true);
  }, [existingLeadData, isInviteMode]);

  useEffect(() => {
    if (!loggedInUser || isInviteMode) return;

    const prefill = getUserPrefill(loggedInUser);
    setForm((current) => ({
      name: current.name || prefill.name,
      phone: current.phone || prefill.phone,
      email: current.email || prefill.email,
    }));
  }, [loggedInUser, isInviteMode]);

  const developer = project.developer as ContactLike | string | null | undefined;
  const createdBy = project.createdBy as ContactLike | string | null | undefined;

  const contactName =
    isContactObject(developer)
      ? developer.companyName ||
        developer.name ||
        developer.fullName ||
        (isContactObject(createdBy) ? createdBy.name : undefined) ||
        project.title
      : isContactObject(createdBy)
        ? createdBy.name || project.title
        : project.title;
  const projectContact = project as FeaturedProject & ContactLike & {
    contactPhone?: string;
    phoneNumber?: string;
    mobile?: string;
    contactEmail?: string;
  };
  const contactPhone =
    (isContactObject(developer) ? developer.phone || developer.contact : "") ||
    (isContactObject(createdBy) ? createdBy.phone || createdBy.contact : "") ||
    projectContact.phone ||
    projectContact.contact ||
    projectContact.contactPhone ||
    projectContact.phoneNumber ||
    projectContact.mobile ||
    "";
  const contactEmail =
    (isContactObject(developer) ? developer.email : "") ||
    (isContactObject(createdBy) ? createdBy.email : "") ||
    projectContact.email ||
    projectContact.contactEmail ||
    "";
  const createdById = getEntityId(createdBy);
  const developerId = getEntityId(developer);
  const ownerPhone = contactPhone ? sanitizePhoneInput(contactPhone) : "";
  const ownerEmail = normalizeComparableValue(contactEmail);
  const userEmail = normalizeComparableValue(userLeadEmail);
  const isOwnProjectLead =
    Boolean(loggedInUser) &&
    (
      (Boolean(loggedInUserId) &&
        (loggedInUserId === createdById || loggedInUserId === developerId)) ||
      (Boolean(userLeadPhone) && Boolean(ownerPhone) && userLeadPhone === ownerPhone) ||
      (Boolean(userEmail) && Boolean(ownerEmail) && userEmail === ownerEmail)
    );

  const promotionType = String(project.promotion?.type || "normal").toLowerCase();
  const isTopSellingPromotion = [
    "top selling",
    "top-selling",
    "top_selling",
    "sponsored",
  ].includes(promotionType);
  const isNormalPromotion = promotionType === "normal" && !isTopSellingPromotion;
  const contactRole = isTopSellingPromotion ? "Seller" : "Builder";
  const submitButtonLabel = isNormalPromotion ? "Request Callback" : "Get Contact Details";
  const ownProjectLeadMessage = "You cannot submit a lead for your own project.";
  const hasPrefilledUserDetails =
    Boolean(loggedInUser) &&
    Boolean(form.name.trim()) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.email.trim());
  const standardWrapperClassName = isModal
    ? "relative w-full rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
    : "w-full rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:max-w-[390px] lg:p-5";
  const inviteWrapperClassName = isModal
    ? "relative w-full rounded-md border border-emerald-300 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.1)]"
    : "w-full rounded-md border border-emerald-300 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.1)] lg:sticky lg:top-20 lg:max-w-[390px] lg:p-5";
  const selectedTimeline = intentionAnswers.find(
    (item) => item.question === BUY_TIMELINE_QUESTION,
  )?.answer;
  const selectedBudget = intentionAnswers.find(
    (item) => item.question === BUDGET_QUESTION,
  )?.answer;

  const leadsMutation = useMutation({
    mutationFn: projectpostLeads,
    onSuccess: (response) => {
      toast.success(
        isNormalPromotion
          ? "Callback request submitted successfully"
          : "Lead submitted successfully",
      );
      const createdLeadId = response?.data?._id || response?.data?.id || "";
      setLeadId(createdLeadId);
      setShowSubmittedStep(true);
      setForm(getUserPrefill(loggedInUser));
      setTermsAccepted(false);
    },
    onError: (error) => {
      toast.error(getLeadErrorMessage(error));
    },
  });

  const intentionMutation = useMutation({
    mutationFn: ({
      leadId: currentLeadId,
      intention,
    }: {
      leadId: string;
      intention: IntentionAnswer[];
    }) => patchProjectLeadIntention(currentLeadId, { intention }),
    onError: (error) => {
      toast.error(getLeadErrorMessage(error));
    },
  });

  useEffect(() => {
    if (isInviteMode) return;

    if (hasPrefilledUserDetails) {
      setTermsAccepted(true);
    }
  }, [hasPrefilledUserDetails, isInviteMode]);

  const updateIntentionAnswer = (question: string, answer: string) => {
    setIntentionAnswers((current) => {
      const next = [
        ...current.filter((item) => item.question !== question),
        { question, answer },
      ];

      if (leadId) {
        intentionMutation.mutate({ leadId, intention: next });
      }

      return next;
    });
  };

  // Standard Lead Submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isOwnProjectLead) {
      toast.error(ownProjectLeadMessage);
      return;
    }

    if (!isValidName(form.name)) {
      toast.error("Full Name should contain letters only");
      return;
    }

    if (!isValidPhoneNumber(form.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    leadsMutation.mutate({
      name: form.name.trim(),
      phone: form.phone,
      email: form.email.trim(),
      projectId: resolvedProjectId,
      remarks: isNormalPromotion ? "Requested callback" : "Requested contact details",
    });
  };

  // Builder Approval Form Request OTP
  const handleBuilderSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();

    if (!isValidName(form.name)) {
      toast.error("Full Name should contain letters only");
      return;
    }

    if (!isValidPhoneNumber(form.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isValidEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");
    setBuilderFormError("");
    setRoleConflict(null);

    try {
      const payload = {
        phone: form.phone,
        email: form.email.trim(),
        contactName: form.name.trim(),
        companyName: form.name.trim(),
      };

      const res = await fetch(
        `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(inviteToken!)}/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const apiError = await parseInviteApiError(res);
        if (apiError.code === "ACCOUNT_ROLE_CONFLICT") {
          setRoleConflict({
            message: apiError.message,
            conflictField: apiError.conflictField,
            conflictRole: apiError.conflictRole,
            conflictDisplayRole: apiError.conflictDisplayRole,
            conflictValue: apiError.conflictValue,
          });
          setInviteStep("role_conflict");
          return;
        }
        throw new Error(apiError.message || "Failed to send OTP");
      }
      const json = await res.json().catch(() => ({}));

      toast.success(
        json?.data?.message || "OTP sent successfully to your contact details",
      );
      setInviteStep("otp");
    } catch (err: any) {
      const errMsg = err?.message || "Failed to send OTP";
      setBuilderFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setOtpSubmitting(false);
    }
  };

  // Verify OTP & Claim Project
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 4) {
      setOtpError("Please enter a 4-digit OTP");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");
    setRoleConflict(null);

    try {
      const res = await fetch(
        `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(inviteToken!)}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otp: cleanOtp,
            phone: form.phone,
            contactName: form.name.trim(),
            companyName: form.name.trim(),
            email: form.email.trim(),
          }),
        },
      );

      if (!res.ok) {
        const apiError = await parseInviteApiError(res);
        if (apiError.code === "ACCOUNT_ROLE_CONFLICT") {
          setRoleConflict({
            message: apiError.message,
            conflictField: apiError.conflictField,
            conflictRole: apiError.conflictRole,
            conflictDisplayRole: apiError.conflictDisplayRole,
            conflictValue: apiError.conflictValue,
          });
          setInviteStep("role_conflict");
          return;
        }
        throw new Error(apiError.message || "Incorrect OTP");
      }
      const json = await res.json().catch(() => ({}));

      // Automatically log the builder into the website
      if (json?.data?.token) {
        Cookies.set("token", json.data.token, {
          expires: 7,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
        });
        queryClient.invalidateQueries({ queryKey: ["user"] });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-changed"));
        }
      }

      toast.success("Project approved successfully!");
      setInviteStep("success");
    } catch (err: any) {
      setOtpError(err?.message || "OTP verification failed");
      toast.error(err?.message || "OTP verification failed");
    } finally {
      setOtpSubmitting(false);
    }
  };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (builderFormError) setBuilderFormError("");
    if (roleConflict) setRoleConflict(null);
    if (inviteStep === "role_conflict" || inviteStep === "review_sent") {
      setInviteStep("form");
    }
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === "phone"
          ? sanitizePhoneInput(value)
          : name === "name"
            ? sanitizeNameInput(value)
            : value,
    }));
  }

  function handleInvalid(
    e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    e.currentTarget.setCustomValidity(getFieldValidationMessage(e.currentTarget));
  }

  function handleFieldInput(
    e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    e.currentTarget.setCustomValidity("");
  }

  const intentionQuestions = (
    <div className="bg-white p-3">
      <p className="text-sm font-semibold text-slate-800">{BUY_TIMELINE_QUESTION}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {buyTimelineOptions.map((option) => {
          const active = selectedTimeline === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => updateIntentionAnswer(BUY_TIMELINE_QUESTION, option)}
              className={`min-h-8 rounded-md px-1.5 py-1 text-center text-[10px] font-semibold leading-tight transition sm:px-2 sm:text-[11px] ${
                active
                  ? "bg-[#27AE60] text-white shadow-sm"
                  : "bg-emerald-50 text-slate-600 hover:bg-emerald-100"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">{BUDGET_QUESTION}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {budgetOptions.map((option) => {
          const active = selectedBudget === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => updateIntentionAnswer(BUDGET_QUESTION, option)}
              className={`min-h-8 rounded-md px-1.5 py-1 text-center text-[10px] font-semibold leading-tight transition sm:px-2 sm:text-[11px] ${
                active
                  ? "bg-[#27AE60] text-white shadow-sm"
                  : "bg-emerald-50 text-slate-600 hover:bg-emerald-100"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  // BUILDER APPROVAL MODE RENDERING
  if (isInviteMode) {
    const conflictRoleLabel = prettifyConflictRole(
      roleConflict?.conflictDisplayRole || roleConflict?.conflictRole,
    );
    const conflictFieldLabel =
      roleConflict?.conflictField === "email" ? "email address" : "mobile number";

    return (
      <aside id="contact-seller" className={inviteWrapperClassName}>
        {isModal && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact dialog"
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 hover:text-slate-700"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        ) : null}
        {/* Banner Header */}
        

        {inviteStep === "success" ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-md">
              <span className="h-6 w-3 rotate-45 border-b-2 border-r-2 border-white" />
            </div>
            <div>
              <p className="text-base font-bold text-[#27AE60]">
                Project Approved
              </p>
            </div>
            <button
              onClick={() => router.push("/builder/my-projects")}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#27AE60] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#219150]"
            >
              Go to Builder Dashboard →
            </button>
          </div>
        ) : inviteStep === "review_sent" ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-md">
              <span className="h-6 w-3 rotate-45 border-b-2 border-r-2 border-white" />
            </div>
            <div>
              <p className="text-base font-bold text-[#27AE60]">
                Review Request Submitted
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Our admin team has received your request and will review this account-role conflict shortly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRoleConflict(null);
                setInviteStep("form");
              }}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#27AE60] bg-white px-4 py-3 text-sm font-bold text-[#27AE60] shadow-sm hover:bg-emerald-50"
            >
              Use Different Contact Details
            </button>
          </div>
        ) : inviteStep === "role_conflict" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-red-200 bg-linear-to-br from-red-50 via-white to-red-50 p-3.5 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-500">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-600">
                    Account role conflict
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-700">
                    This {conflictFieldLabel} is registered as a{" "}
                    <span className="font-bold text-red-600">{conflictRoleLabel}</span>{" "}
                    <span className="font-bold text-red-600">account</span>.
                    {` `}
                    {conflictRoleLabel} accounts can continue with their current role, but cannot approve Builder CRM projects.
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-red-100 pt-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-500">
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 21a6 6 0 0 0-12 0" />
                      <circle cx="12" cy="11" r="4" />
                    </svg>
                  </div>
                  <p className="pt-1 text-[13px] leading-5 text-slate-700">
                    Send this request to Admin for builder account review.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => reviewTicketMutation.mutate()}
              disabled={reviewTicketMutation.isPending}
              className="h-11 w-full rounded-md bg-[#1f9d55] text-sm font-bold text-white shadow-sm transition hover:bg-[#188746] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {reviewTicketMutation.isPending
                ? "Sending..."
                : "Send for Admin Review"}
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleConflict(null);
                setBuilderFormError("");
                setOtpError("");
                setInviteStep("form");
                if (roleConflict?.conflictField === "email") {
                  setForm((current) => ({ ...current, email: "" }));
                  return;
                }
                setForm((current) => ({ ...current, phone: "" }));
              }}
              className="h-11 w-full rounded-md border border-[#27AE60] bg-white text-sm font-bold text-[#27AE60] shadow-sm transition hover:bg-emerald-50"
            >
              {roleConflict?.conflictField === "email"
                ? "Use different email address"
                : "Use different mobile number"}
            </button>
          </div>
        ) : inviteStep === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Enter 4-Digit Verification Code</p>
              <p className="mt-1 text-xs text-slate-500">
                Sent to <span className="font-semibold text-slate-800">{form.phone || form.email}</span>
              </p>
            </div>

            <div className="py-2">
              <OtpFourDigitInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setOtpError("");
                }}
                disabled={otpSubmitting}
                error={Boolean(otpError)}
                autoFocus
              />
            </div>

            {otpError && (
              <p className="text-center text-xs font-medium text-red-600">{otpError}</p>
            )}

            <button
              type="submit"
              disabled={otpSubmitting || otp.length !== 4}
              className="h-10 w-full rounded-xl bg-[#27AE60] text-sm font-bold text-white shadow-sm transition hover:bg-[#219150] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {otpSubmitting ? "Verifying..." : "Verify OTP "}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setInviteStep("form")}
                className="font-medium text-slate-600 hover:text-slate-900 underline"
              >
                ← Edit Contact Info
              </button>
              <button
                type="button"
                onClick={handleBuilderSubmit}
                disabled={otpSubmitting}
                className="font-semibold text-[#27AE60] hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBuilderSubmit} className="mt-4 space-y-3 sm:space-y-4">
            <p className="text-xs font-medium text-slate-600">
              Please share your contact details to approve this project:
            </p>

            <label className="block">
              <span className="text-sm text-slate-600">Full Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                onInvalid={handleInvalid}
                onInput={handleFieldInput}
                placeholder="Enter Full Name"
                inputMode="text"
                pattern="[A-Za-z\s]+"
                title="Full Name should contain letters only"
                required
                className="mt-1.5 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-600">Mobile Number</span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="^\+?[1-9]\d{9,14}$"
                value={form.phone}
                onChange={handleChange}
                onInvalid={handleInvalid}
                onInput={handleFieldInput}
                title="Please enter a valid phone number"
                placeholder="Enter Mobile Number"
                required
                className="mt-1.5 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-600">Email ID</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onInvalid={handleInvalid}
                onInput={handleFieldInput}
                autoComplete="email"
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                title="Please enter a valid email address"
                placeholder="Enter Email Address"
                required
                className="mt-1.5 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input
                name="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  event.currentTarget.setCustomValidity("");
                  setTermsAccepted(event.target.checked);
                }}
                onInvalid={(event) =>
                  event.currentTarget.setCustomValidity(
                    "Please accept the Terms & Conditions",
                  )
                }
                required
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white transition peer-checked:border-[#27AE60] peer-checked:bg-[#27AE60] peer-focus-visible:ring-2 peer-focus-visible:ring-[#27AE60]/25"
              >
                <span className="h-2 w-1 rotate-45 border-b-2 border-r-2 border-white" />
              </span>
              <span className="leading-5">
                I agree to Propenu's{" "}
                <Link
                  href="/terms"
                  className="font-medium text-slate-900 underline underline-offset-2 hover:text-[#27AE60]"
                  onClick={(event) => event.stopPropagation()}
                >
                  Terms & Conditions
                </Link>
              </span>
            </label>

            {builderFormError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-relaxed text-red-700">
                ⚠️ {builderFormError}
              </div>
            )}

            <button
              type="submit"
              disabled={otpSubmitting}
              className="h-11 w-full rounded-md bg-[#27AE60] text-sm font-bold text-white shadow-sm transition hover:bg-[#219150] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {otpSubmitting ? "Sending OTP..." : "Approve Project"}
            </button>
          </form>
        )}
      </aside>
    );
  }

  // STANDARD LEAD FORM (WHEN NO INVITE TOKEN IS PRESENT)
  return (
    <aside id="contact-seller" className={standardWrapperClassName}>
      {isModal && onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contact dialog"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 hover:text-slate-700"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      ) : null}
      {!showSubmittedStep && (
        <>
          <div className="mt-4 flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white sm:h-18 sm:w-18">
              {project.logo?.url ? (
                <img
                  src={project.logo.url}
                  alt={`${contactName} logo`}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-sm font-semibold text-emerald-600">
                  {contactName.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-950 sm:text-base">
                {contactName}
              </p>
              <p className="text-sm text-slate-500">{contactRole}</p>
            </div>
          </div>

          {hasPrefilledUserDetails ? null : (
            <p className="mt-4 text-sm font-medium text-slate-950 sm:text-base">
              Please share your contact details
            </p>
          )}
          {isOwnProjectLead ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              {ownProjectLeadMessage}
            </div>
          ) : null}
        </>
      )}

      {showSubmittedStep ? (
        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-md bg-white transition-all duration-300 ease-out">
          <div className="bg-white px-4 py-5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-sm">
              <span className="h-5 w-2.5 rotate-45 border-b-2 border-r-2 border-white" />
            </div>
            {isNormalPromotion ? (
              <>
                <p className="mt-4 text-base font-semibold text-[#27AE60]">
                  Thank you for showing interest in this project.
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  Propenu representative will reach out to you shortly.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-base font-semibold text-[#27AE60]">Thank You!</p>
               
              </>
            )}
          </div>

          {!isNormalPromotion && (
            <div className="bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                {contactRole === "Seller" ? "Contact seller" : "Contact builder"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                  {project.logo?.url ? (
                    <img
                      src={project.logo.url}
                      alt={`${contactName} logo`}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-emerald-600">
                      {contactName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{contactName}</p>
                  <p className="text-xs text-slate-500">{contactRole}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-700">
                <p className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Phone</span>
                  <span className="font-medium text-slate-950">{contactPhone || "Not available"}</span>
                </p>
                {contactEmail && (
                  <p className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-xs text-slate-500">Email</span>
                    <span className="break-all text-right text-xs font-medium text-slate-700">{contactEmail}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {intentionQuestions}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
          {hasPrefilledUserDetails ? null : (
            <>
              <label className="block">
                <span className="text-sm text-slate-600">Full Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  placeholder="Enter Name"
                  inputMode="text"
                  pattern="[A-Za-z\s]+"
                  title="Full Name should contain letters only"
                  required
                  className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-600">Mobile</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^\+?[1-9]\d{9,14}$"
                  value={form.phone}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  title="Please enter a valid phone number"
                  placeholder="Enter Mobile Number"
                  required
                  className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-600">Email ID</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  autoComplete="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Please enter a valid email address"
                  placeholder="Enter your Email ID"
                  required
                  className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
                <input
                  name="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => {
                    event.currentTarget.setCustomValidity("");
                    setTermsAccepted(event.target.checked);
                  }}
                  onInvalid={(event) =>
                    event.currentTarget.setCustomValidity(
                      "Please accept the Terms & Conditions",
                    )
                  }
                  required
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white transition peer-checked:border-[#27AE60] peer-checked:bg-[#27AE60] peer-focus-visible:ring-2 peer-focus-visible:ring-[#27AE60]/25"
                >
                  <span className="h-2 w-1 rotate-45 border-b-2 border-r-2 border-white" />
                </span>
                <span className="leading-5">
                  I agree to Propenu's{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-slate-900 underline underline-offset-2 hover:text-[#27AE60]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={leadsMutation.isPending || isOwnProjectLead}
            className="h-10 w-full btn-primary text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {leadsMutation.isPending ? "Submitting..." : submitButtonLabel}
          </button>
        </form>
      )}
    </aside>
  );
};

export default ContactSeller;














