"use client";

import LeadDialog from "@/app/(pages)/properties/cards/LeadDialog";
import LoginDialog from "@/app/(auth)/Login";
import {
  me,
  postPublicPropertyLead,
  requestPublicPropertyLeadOtp,
  verifyPublicPropertyLeadOtp,
} from "@/data/ClientData";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { listingSourceToOwnershipLabel } from "@/utilies/resolveListingSource";
import { trackInteraction } from "@/services/trackingService";
import { HiXMark } from "react-icons/hi2";
import { z } from "zod";
import OtpFourDigitInput from "@/components/builder/OtpFourDigitInput";

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

type ContactOwnerFormValues = {
  name: string;
  phone: string;
  email: string;
  termsAccepted: boolean;
};

type ContactOwnerFormErrors = Partial<
  Record<keyof ContactOwnerFormValues, string>
>;

const CONTACT_OWNER_OTP_LENGTH = 4;

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

function sanitizeNameInput(value?: string | null) {
  return String(value || "").replace(/[^A-Za-z\s]/g, "");
}

function isValidName(value: string) {
  return /^[A-Za-z\s]+$/.test(value.trim());
}

function isValidPhoneNumber(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return /^\+?[1-9]\d{9,14}$/.test(normalized);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

const contactOwnerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please enter your full name" })
    .refine(isValidName, { message: "Full Name should contain letters only" }),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Please enter your mobile number" })
    .refine(isValidPhoneNumber, { message: "Please enter a valid phone number" }),
  email: z
    .string()
    .trim()
    .refine((value) => !value || isValidEmail(value), {
      message: "Please enter a valid email address",
    }),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "Please accept the Terms & Conditions",
  }),
});

function validateContactOwnerForm(
  values: ContactOwnerFormValues,
): ContactOwnerFormErrors {
  const result = contactOwnerFormSchema.safeParse(values);

  if (result.success) return {};

  const nextErrors: ContactOwnerFormErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ContactOwnerFormValues | undefined;
    if (field && !nextErrors[field]) {
      nextErrors[field] = issue.message;
    }
  }

  return nextErrors;
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [openLoginAfterClose, setOpenLoginAfterClose] = useState(false);
  const [showGuestSuccessState, setShowGuestSuccessState] = useState(false);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState<ContactOwnerFormErrors>({});
  const [contactLeadStep, setContactLeadStep] = useState<"form" | "otp">("form");
  const [contactLeadOtp, setContactLeadOtp] = useState("");
  const [contactLeadOtpError, setContactLeadOtpError] = useState("");
  const [contactLeadOtpSubmitting, setContactLeadOtpSubmitting] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      name: current.name || sanitizeNameInput(user.name || user.fullName || ""),
      phone: current.phone || sanitizePhoneInput(user.phone),
      email: current.email || String(user.email || ""),
    }));
  }, [user]);

  useEffect(() => {
    if (isLeadReady) {
      setTermsAccepted(true);
    }
  }, [isLeadReady]);

  useEffect(() => {
    if (!showContactModal && openLoginAfterClose) {
      const timer = window.setTimeout(() => {
        setShowLoginDialog(true);
        setOpenLoginAfterClose(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [showContactModal, openLoginAfterClose]);

  const { mutateAsync: postLead, isPending: isLeadPosting } = useMutation({
    mutationFn: postPublicPropertyLead,
    onSuccess: (response) => {
      toast.success(response?.message || "Lead submitted successfully");
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
      if (user) {
        setShowLeadDialog(true);
      } else {
        setShowLeadDialog(false);
        setShowGuestSuccessState(true);
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to contact owner";

      toast.error(message);
    },
  });

  const submitLead = async (payload: {
    name: string;
    phone: string;
    email?: string;
  }, currentUser?: any) => {
    if (isOwnLeadForUser(currentUser || user)) {
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
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? undefined,
      projectId,
      propertyType,
      listingType: resolvedListingType,
      remarks: "Interested in this property",
    });
  };

  const handleRequestLeadOtp = async () => {
    setContactLeadOtpSubmitting(true);
    setContactLeadOtpError("");

    try {
      await requestPublicPropertyLeadOtp({
        phone: form.phone,
        projectId: projectId || undefined,
        propertyType,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send OTP";
      setContactLeadOtpError(message);
      toast.error(message);
      return;
    } finally {
      setContactLeadOtpSubmitting(false);
    }

    setContactLeadStep("otp");
    setContactLeadOtp("");
    toast.success("OTP sent to your mobile number");
  };

  const handleVerifyLeadOtp = async (
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
    if (e) e.preventDefault();

    const cleanOtp = contactLeadOtp.trim();
    if (cleanOtp.length !== CONTACT_OWNER_OTP_LENGTH) {
      setContactLeadOtpError("Please enter a 4-digit OTP");
      return;
    }

    setContactLeadOtpSubmitting(true);
    setContactLeadOtpError("");

    try {
      await verifyPublicPropertyLeadOtp({
        phone: form.phone,
        otp: cleanOtp,
        projectId: projectId || undefined,
      });
      toast.success("Phone number verified successfully");

      await submitLead(
        {
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim() || undefined,
        },
        user,
      );
      setContactLeadStep("form");
      setContactLeadOtp("");
      setContactLeadOtpError("");
      if (user) {
        setShowContactModal(false);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "OTP verification failed";
      setContactLeadOtpError(message);
      toast.error(message);
    } finally {
      setContactLeadOtpSubmitting(false);
    }
  };

  const handleContactOwner = () => {
    if (isOwnPropertyLead) {
      toast.error(ownPropertyLeadMessage);
      return;
    }

    if (!projectId) {
      toast.error("Property ID missing");
      return;
    }

    setShowContactModal(true);
    setShowGuestSuccessState(false);
  };

  const handleSubmitLeadForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors = validateContactOwnerForm({
      name: form.name,
      phone: form.phone,
      email: form.email,
      termsAccepted,
    });

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await handleRequestLeadOtp();
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

      {showContactModal &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4">
            <div
              className="absolute inset-0"
              onClick={() => setShowContactModal(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-[420px] rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact dialog"
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 hover:text-slate-700"
              >
                <HiXMark className="h-5 w-5" />
              </button>

              <div className="mt-4 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white text-sm font-semibold text-emerald-600">
                  {(ownerName || getContactPerson()).charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950 sm:text-base">
                    {ownerName || "Property owner"}
                  </p>
                  <p className="text-sm text-slate-500">{getContactPerson()}</p>
                </div>
              </div>

              {contactLeadStep === "otp" ? (
                <form onSubmit={handleVerifyLeadOtp} className="mt-5 space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">
                      Verify Mobile Number
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Enter the 4-digit OTP sent to{" "}
                      <span className="font-semibold text-slate-800">
                        {form.phone}
                      </span>
                    </p>
                  </div>

                  <div className="py-2">
                    <OtpFourDigitInput
                      value={contactLeadOtp}
                      onChange={(value) => {
                        setContactLeadOtp(value);
                        setContactLeadOtpError("");
                      }}
                      disabled={contactLeadOtpSubmitting || isLeadPosting}
                      error={Boolean(contactLeadOtpError)}
                      autoFocus
                    />
                  </div>

                  {contactLeadOtpError ? (
                    <p className="text-center text-xs font-medium text-red-600">
                      {contactLeadOtpError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={
                      contactLeadOtpSubmitting ||
                      isLeadPosting ||
                      contactLeadOtp.length !== CONTACT_OWNER_OTP_LENGTH
                    }
                    className="h-10 w-full rounded-xl bg-[#27AE60] text-sm font-bold text-white shadow-sm transition hover:bg-[#219150] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactLeadOtpSubmitting || isLeadPosting
                      ? "Verifying..."
                      : "Verify & Continue"}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setContactLeadStep("form");
                        setContactLeadOtp("");
                        setContactLeadOtpError("");
                      }}
                      className="font-medium text-slate-600 underline hover:text-slate-900"
                    >
                      ← Edit Contact Info
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestLeadOtp}
                      disabled={contactLeadOtpSubmitting || isLeadPosting}
                      className="font-semibold text-[#27AE60] hover:underline disabled:opacity-60"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              ) : showGuestSuccessState ? (
                <div className="mt-5 space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#27AE60] text-white shadow-md">
                    <span className="h-6 w-3 rotate-45 border-b-2 border-r-2 border-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#27AE60]">
                      Lead Submitted Successfully
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your lead has been submitted successfully. To view the owner's contact details, please log in here.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuestSuccessState(false);
                        setShowContactModal(false);
                        setOpenLoginAfterClose(true);
                      }}
                      className="h-10 w-full rounded-md bg-[#27AE60] text-sm font-semibold text-white shadow-sm transition hover:bg-[#219150]"
                    >
                      Login Here
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-sm font-medium text-slate-950 sm:text-base">
                    Please share your contact details
                  </p>

                  <form onSubmit={handleSubmitLeadForm} className="mt-4 space-y-3 sm:space-y-4">
                    <label className="block">
                      <span className="text-sm text-slate-600">Full Name</span>
                      <input
                        name="name"
                        value={form.name}
                        onChange={(event) => {
                          setFormErrors((current) => ({
                            ...current,
                            name: undefined,
                          }));
                          setForm((current) => ({
                            ...current,
                            name: sanitizeNameInput(event.target.value),
                          }));
                        }}
                        placeholder="Enter Name"
                        inputMode="text"
                        required
                        aria-invalid={Boolean(formErrors.name)}
                        className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.name ? (
                        <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="text-sm text-slate-600">Mobile</span>
                      <input
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) => {
                          setFormErrors((current) => ({
                            ...current,
                            phone: undefined,
                          }));
                          setForm((current) => ({
                            ...current,
                            phone: sanitizePhoneInput(event.target.value),
                          }));
                        }}
                        placeholder="Enter Mobile Number"
                        required
                        aria-invalid={Boolean(formErrors.phone)}
                        className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.phone ? (
                        <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="text-sm text-slate-600">Email ID</span>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => {
                          setFormErrors((current) => ({
                            ...current,
                            email: undefined,
                          }));
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }));
                        }}
                        autoComplete="email"
                        placeholder="Enter your Email ID"
                        aria-invalid={Boolean(formErrors.email)}
                        className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
                      />
                      {formErrors.email ? (
                        <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                      ) : null}
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-600 sm:text-sm">
                      <input
                        name="terms"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(event) => {
                          setTermsAccepted(event.target.checked);
                          setFormErrors((current) => ({
                            ...current,
                            termsAccepted: undefined,
                          }));
                        }}
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
                    {formErrors.termsAccepted ? (
                      <p className="-mt-1 text-xs text-red-600">
                        {formErrors.termsAccepted}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={contactLeadOtpSubmitting || isLeadPosting}
                      className="h-10 w-full btn-primary text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {contactLeadOtpSubmitting
                        ? "Sending OTP..."
                        : isLeadPosting
                          ? "Submitting..."
                          : `Contact ${getContactPerson()}`}
                    </button>
                  </form>
                </>
              )}
            </div>
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

      {showLoginDialog &&
        createPortal(
          <LoginDialog
            open
            onClose={() => setShowLoginDialog(false)}
            onSwitchToRegister={() => setShowLoginDialog(false)}
          />,
          document.body,
        )}
    </>
  );
}
