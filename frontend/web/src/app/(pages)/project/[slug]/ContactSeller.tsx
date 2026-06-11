"use client";

import LeadDialog from "@/app/(pages)/properties/cards/LeadDialog";
import { projectpostLeads } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import React, { useState } from "react";
import { toast } from "sonner";

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

const ContactSeller = ({ project }: ContactSellerProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const developer = project.developer as ContactLike | string | null | undefined;
  const createdBy = project.createdBy as ContactLike | string | null | undefined;
  const [showLeadDialog, setShowLeadDialog] = useState(false);

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
  const contactPhone =
    isContactObject(developer)
      ? developer.phone || developer.contact
      : isContactObject(createdBy)
        ? createdBy.phone || createdBy.contact
        : "";
  const contactEmail =
    isContactObject(developer)
      ? developer.email
      : isContactObject(createdBy)
        ? createdBy.email
        : "";

  const leadsMutation = useMutation({
    mutationFn: projectpostLeads,
    onSuccess: () => {
      setShowLeadDialog(true);
      toast.success("Lead submitted successfully");
      setForm({
        name: "",
        phone: "",
        email: "",
      });
    },
    onError: (error) => {
      toast.error(getLeadErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    leadsMutation.mutate({
      name: form.name,
      phone: form.phone,
      email: form.email,
      projectId: project._id,
    });
  };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <aside className="w-full rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:max-w-[390px] lg:p-5">
      <h2 className="text-lg font-medium text-slate-950 sm:text-xl">Contact builder</h2>

      <div className="mt-4 flex items-center gap-3">
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
          <p className="text-sm text-slate-500">Developer</p>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-950 sm:text-base">
        Please share your contact details
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">Full Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter Name"
            required
            className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-600">Mobile</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
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
            placeholder="Enter your Email ID"
            required
            className="mt-2 h-10 w-full rounded-md border-0 bg-emerald-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
          /> 
        </label>

        <button
          type="submit"
          disabled={leadsMutation.isPending}
          className="h-10 w-full btn-primary text-sm font-semibold text-white  disabled:cursor-not-allowed disabled:opacity-70"
        >
          {leadsMutation.isPending ? "Submitting..." : "Get Contact Details"}
        </button>
      </form>

      {showLeadDialog &&
        createPortal(
          <LeadDialog
            open={showLeadDialog}
            onClose={() => setShowLeadDialog(false)}
            ownerName={contactName}
            ownerRole="Builder"
            phone={contactPhone}
            email={contactEmail}
            postedOn={(project as any).createdAt}
            price={project.priceFrom ?? project.priceTo}
            propertyLabel={project.title}
          />,
          document.body,
        )}
    </aside>
  );
};

export default ContactSeller;
