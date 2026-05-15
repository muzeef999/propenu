"use client";

import formatINR from "@/utilies/PriceFormat";
import { FiAlertTriangle, FiMail, FiPhone, FiX } from "react-icons/fi";
import { IoWarning } from "react-icons/io5";

export interface LeadDialogProps {
  open: boolean;
  onClose: () => void;
  ownerName?: string;
  ownerRole?: string;
  phone?: string;
  email?: string;
  postedOn?: string | Date;
  price?: number | string;
  propertyLabel?: string;
}

const formatPostedOn = (value?: string | Date) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitial = (value?: string) =>
  value?.trim().charAt(0).toUpperCase() || "P";

const joinSummary = (price?: number | string, propertyLabel?: string) => {
  const items = [formatINR(price), propertyLabel?.trim()].filter(Boolean);
  return items.join("  |  ");
};

export default function LeadDialog({
  open,
  onClose,
  ownerName,
  ownerRole = "Owner",
  phone,
  email,
  postedOn,
  price,
  propertyLabel,
}: LeadDialogProps) {
  if (!open) return null;

  const formattedPostedOn = formatPostedOn(postedOn);
  const summary = joinSummary(price, propertyLabel);
  const hasContactDetails = Boolean(phone || email);

  return (
    <div className="fixed inset-0 z-9999 bg-black/35 p-4">
      <div className="container flex min-h-full items-center justify-center">
        <div className="relative w-full max-w-[640px] rounded-md bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)] sm:p-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <FiX className="h-5 w-5" />
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 border-b border-[#E6E6E6] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#2DB463] text-4xl font-medium text-white">
                  {getInitial(ownerName)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold text-[#2B2B2B]">
                    {ownerName || "Property owner"}
                  </p>
                  <p className="mt-1 text-[15px] text-[#6B6B6B]">{ownerRole}</p>
                </div>
              </div>

              <div className="min-w-0 max-w-[420px] pr-8 text-left sm:text-right">
                {formattedPostedOn ? (
                  <p className="text-[15px] text-[#6B6B6B]">
                    Posted on: {formattedPostedOn}
                  </p>
                ) : null}

                {summary ? (
                  <p className="mt-3 truncate text-[17px] text-[#505050]">
                    {summary}
                  </p>
                ) : null}
              </div>
            </div>

            {hasContactDetails ? (
              <div className="flex flex-col gap-3 border-b border-[#E6E6E6] pb-4 text-[#303030] sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                {phone ? (
                  <div className="flex items-center gap-3 text-[16px]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#7B7B7B]">
                      <FiPhone className="h-4 w-4" />
                    </span>
                    <span>{phone}</span>
                  </div>
                ) : null}

                {email ? (
                  <div className="flex items-center gap-3 text-[16px] break-all">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#7B7B7B]">
                      <FiMail className="h-4 w-4" />
                    </span>
                    <span>{email}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-start gap-3 rounded-xl bg-[#EEF7F1] px-4 py-3 text-[15px] text-[#2F4736]">
              <IoWarning  className="mt-0.5 h-5 w-5 shrink-0 text-[#F0A53B]" />
              <p>Do not make any payment before visiting the property.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
