"use client";

import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { toast } from "sonner";

import { deleteMyAccount } from "@/data/ClientData";

const reasons = [
  "I created this account by mistake",
  "I am not using the platform anymore",
  "I am concerned about privacy",
  "I found another platform",
];

const impacts = [
  "Your profile information and saved preferences will no longer be accessible.",
  "Shortlisted and contacted property history may be removed permanently.",
  "Membership-related details and account benefits may be lost.",
  "This action is intended to be irreversible once confirmed.",
];

type DeleteAccountForm = {
  reason: string;
  feedback: string;
  acknowledged: boolean;
};

const DeleteAccountPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<DeleteAccountForm>({
    reason: "",
    feedback: "",
    acknowledged: false,
  });

  const isFormValid = useMemo(() => {
    return Boolean(
      form.reason &&
      form.acknowledged,
    );
  }, [form]);

  const deleteAccountMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: (data) => {
      toast.success(data?.message || "Account deleted successfully");
      Cookies.remove("token");
      localStorage.removeItem("role");
      localStorage.removeItem("shortlist");
      window.dispatchEvent(new Event("auth-changed"));
      router.push("/");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete your account.",
      );
    },
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : false;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.reason) {
      toast.error("Please select a reason for deleting your account.");
      return;
    }

    if (!form.acknowledged) {
      toast.error("Please acknowledge the deletion warning.");
      return;
    }

    deleteAccountMutation.mutate({
      reason: form.reason,
      feedback: form.feedback.trim(),
    });
  };

  const handleKeepAccount = () => {
    const settingsRoute = pathname.startsWith("/agent")
      ? "/agent/account-settings"
      : pathname.startsWith("/builder")
        ? "/builder/account-settings"
        : "/account/settings";

    router.push(settingsRoute);
  };

  return (
    <div className="space-y-6 font-sans text-[#4A4A4A]">
      <div className="rounded-2xl border border-red-100 bg-linear-to-r from-red-50 via-white to-rose-50 px-5 py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <HiOutlineExclamationTriangle size={24} />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
              Delete Account
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
              Before deleting your account, please review what will be affected.
              Once confirmed, your account will be marked deleted and access
              will be disabled.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm deletion
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the details below to continue with account deletion.
              </p>
            </div>

            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
              Danger Zone
            </span>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
              <p className="text-sm font-medium text-red-700">
                Important
              </p>
              <p className="mt-1 text-sm leading-6 text-red-600">
                Deleting your account may remove your access to saved
                properties, conversations, and membership history.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-800">
                Why are you deleting your account?
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition hover:border-red-200 hover:bg-red-50/40 ${
                      form.reason === reason
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delete-reason"
                      checked={form.reason === reason}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, reason }))
                      }
                      className="mt-1 h-4 w-4 accent-red-500"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            

            <div className="space-y-2">
              <label
                htmlFor="delete-feedback"
                className="text-sm font-medium text-gray-800"
              >
                Additional feedback
              </label>
              <textarea
                id="delete-feedback"
                rows={5}
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                placeholder="Tell us what we could have done better"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-red-300"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input
                type="checkbox"
                name="acknowledged"
                checked={form.acknowledged}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-red-500"
              />
              <span className="text-sm leading-6 text-gray-600">
                I understand that this action may be permanent and that my
                account data could be removed.
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleKeepAccount}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Keep My Account
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || deleteAccountMutation.isPending}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deleteAccountMutation.isPending
                  ? "Deleting Account..."
                  : "Delete My Account"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              What happens next
            </h2>
            <div className="mt-5 space-y-3">
              {impacts.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-amber-900">
              Need help before deleting?
            </h3>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              You may want to review your membership or update your personal
              details instead of removing the account.
            </p>

            <div className="mt-4">
              <button
                type="button"
                className="w-full rounded-xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100/60"
              >
                Review Membership
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
