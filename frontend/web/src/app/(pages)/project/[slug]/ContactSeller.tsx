"use client";

import Link from "next/link";
import { checkProjectLeadSubmitted, me, patchProjectLeadIntention, projectpostLeads } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

type IntentionAnswer = {
  question: string;
  answer: string;
};

const BUY_TIMELINE_QUESTION = "When do you plan to buy?";
const BUDGET_QUESTION = "Your Budget?";
const buyTimelineOptions = ["30 Days", "1 - 3 Months", "3 - 6 Months", "More than 6 Months"];
const budgetOptions = ["50L - 1Cr", "1Cr - 2Cr", "2Cr+"];

type ContactSellerProps = {
  project: FeaturedProject;
};

type ContactLike = {
  name?: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  contact?: string;
  email?: string;
};

type UserProfile = {
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
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

const ContactSeller = ({ project }: ContactSellerProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [showSubmittedStep, setShowSubmittedStep] = useState(false);
  const [intentionAnswers, setIntentionAnswers] = useState<IntentionAnswer[]>([]);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });
  const loggedInUser = userData?.user as UserProfile | undefined;
  const userLeadPhone = loggedInUser?.phone
    ? sanitizePhoneInput(loggedInUser.phone)
    : "";
  const userLeadEmail = loggedInUser?.email?.trim() || "";

  const { data: existingLeadData } = useQuery({
    queryKey: ["project-lead-submitted", project._id, userLeadPhone, userLeadEmail],
    queryFn: () =>
      checkProjectLeadSubmitted({
        projectId: project._id,
        phone: userLeadPhone,
        email: userLeadEmail,
      }),
    enabled: Boolean(project._id && (userLeadPhone || userLeadEmail)),
    retry: 1,
  });

  useEffect(() => {
    const existingLead = existingLeadData?.data;
    if (!existingLeadData?.submitted || !existingLead) return;

    setLeadId(String(existingLead._id || ""));
    setIntentionAnswers(
      Array.isArray(existingLead.intention) ? existingLead.intention : [],
    );
    setShowSubmittedStep(true);
  }, [existingLeadData]);

  useEffect(() => {
    if (!loggedInUser) return;

    const prefill = getUserPrefill(loggedInUser);
    setForm((current) => ({
      name: current.name || prefill.name,
      phone: current.phone || prefill.phone,
      email: current.email || prefill.email,
    }));
  }, [loggedInUser]);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      projectId: project._id,
      remarks: isNormalPromotion ? "Requested callback" : "Requested contact details",
    });
  };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
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

  return (
    <aside className="w-full rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:max-w-[390px] lg:p-5">

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

          <p className="mt-4 text-sm font-medium text-slate-950 sm:text-base">
            Please share your contact details
          </p>
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
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  View the seller's contact details below.<br />
                  Your enquiry has been shared.
                </p>
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

          <button
            type="submit"
            disabled={leadsMutation.isPending}
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














