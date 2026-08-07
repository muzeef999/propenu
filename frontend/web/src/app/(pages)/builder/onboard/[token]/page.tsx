"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

type Step =
  | "contact"
  | "mobile"
  | "existing_otp"
  | "new_account"
  | "location"
  | "done";

type InviteData = {
  invite: { email?: string; phone?: string; companyName?: string };
  project: { title?: string; slug?: string };
};

type ExistingBuilder = {
  id: string;
  name?: string;
  email?: string;
  companyName?: string;
};

export default function BuilderOnboardPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<InviteData | null>(null);
  const [step, setStep] = useState<Step>("contact");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingBuilder, setExistingBuilder] = useState<ExistingBuilder | null>(
    null,
  );

  const [form, setForm] = useState({
    handlerName: "",
    handlerPhone: "",
    handlerEmail: "",
    phone: "",
    otp: "",
    name: "",
    companyName: "",
    email: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Invalid invite");
        const data = json.data as InviteData;
        setInfo(data);
        setForm((f) => ({
          ...f,
          email: data?.invite?.email || "",
          companyName: data?.invite?.companyName || "",
          handlerEmail: data?.invite?.email || "",
        }));
      } catch (err: any) {
        setError(err?.message || "Failed to load invite");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const normalizePhone = (value: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (String(value || "").startsWith("+")) return String(value).trim();
    return digits ? `+${digits}` : "";
  };

  const projectContactsPayload = () => [
    {
      name: form.handlerName.trim(),
      phone: normalizePhone(form.handlerPhone) || normalizePhone(form.phone),
      email:
        form.handlerEmail.trim().toLowerCase() ||
        form.email.trim().toLowerCase(),
      role: "Primary",
      isPrimary: true,
    },
  ];

  const claimProject = async (phone: string) => {
    const claimRes = await fetch(
      `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(token)}/claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: form.name.trim() || existingBuilder?.name,
          contactName: form.name.trim() || existingBuilder?.name,
          companyName: form.companyName.trim() || existingBuilder?.companyName,
          email:
            form.email.trim().toLowerCase() ||
            existingBuilder?.email ||
            info?.invite?.email,
          projectContacts: projectContactsPayload(),
        }),
      },
    );
    const claimJson = await claimRes.json().catch(() => ({}));
    if (!claimRes.ok) {
      throw new Error(claimJson?.error || "Failed to approve/claim project");
    }
    return claimJson;
  };

  const onContactNext = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.handlerName.trim() || !form.handlerPhone.trim()) {
      setError("Project contact name and phone are required");
      return;
    }
    setStep("mobile");
  };

  const onMobileContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const phone = normalizePhone(form.phone);
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid mobile number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(token)}/check-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Phone check failed");

      if (json?.data?.exists) {
        setExistingBuilder(json.data.builder);
        setForm((f) => ({
          ...f,
          name: json.data.builder?.name || f.name,
          companyName: json.data.builder?.companyName || f.companyName,
          email: json.data.builder?.email || f.email,
        }));
        setStep("existing_otp");
        setOtpSent(false);
      } else {
        setExistingBuilder(null);
        setStep("new_account");
        setOtpSent(false);
      }
    } catch (err: any) {
      setError(err?.message || "Phone check failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sendLoginOtp = async () => {
    setError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      const res = await fetch(`${apiBase}/api/users/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to send OTP");
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const sendCreateOtp = async () => {
    setError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      const res = await fetch(`${apiBase}/api/users/auth/request-otp/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to send OTP");
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const onExistingApprove = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      if (!form.otp.trim()) throw new Error("Enter mobile OTP");

      const verifyRes = await fetch(`${apiBase}/api/users/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: form.otp.trim() }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        throw new Error(verifyJson?.message || "OTP verification failed");
      }
      if (verifyJson?.token) {
        Cookies.set("token", verifyJson.token, { expires: 7 });
      }

      await claimProject(phone);
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Approve failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onNewAccountVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      if (!form.name.trim() || !form.companyName.trim() || !form.email.trim()) {
        throw new Error("Fill name, company name and email");
      }
      if (!form.otp.trim()) throw new Error("Enter mobile OTP");

      const signupRes = await fetch(
        `${apiBase}/api/users/auth/verify-otp/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            otp: form.otp.trim(),
            name: form.name.trim(),
            companyName: form.companyName.trim(),
            email: form.email.trim().toLowerCase(),
            role: "builder",
          }),
        },
      );
      const signupJson = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok) {
        throw new Error(signupJson?.message || "Account create failed");
      }
      if (signupJson?.token) {
        Cookies.set("token", signupJson.token, { expires: 7 });
      }

      // Builders usually need location step before active
      if (signupJson?.nextStep === "location" || signupJson?.nextStep !== "completed") {
        setStep("location");
      } else {
        await claimProject(phone);
        setStep("done");
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onLocationFinish = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const authToken = Cookies.get("token");
      if (!authToken) throw new Error("Session missing. Verify OTP again.");

      if (
        !form.locality.trim() ||
        !form.city.trim() ||
        !form.state.trim() ||
        !form.pincode.trim()
      ) {
        throw new Error("All location fields are required");
      }

      const locRes = await fetch(
        `${apiBase}/api/users/auth/update-location/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            locality: form.locality.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          }),
        },
      );
      const locJson = await locRes.json().catch(() => ({}));
      if (!locRes.ok) {
        throw new Error(locJson?.message || "Location update failed");
      }
      if (locJson?.token) {
        Cookies.set("token", locJson.token, { expires: 7 });
      }

      await claimProject(normalizePhone(form.phone));
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Finish onboarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const goToProject = () => {
    const slug = info?.project?.slug;
    router.replace(
      slug
        ? `/project/${encodeURIComponent(slug)}?onboarded=1`
        : "/builder",
    );
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm font-semibold text-gray-600">Loading invite…</p>
      </main>
    );
  }

  if (error && !info) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Link href="/" className="text-[#27AE60] font-bold text-sm">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const stepLabel =
    step === "contact"
      ? "1 · Project contact person"
      : step === "mobile"
        ? "2 · Builder mobile"
        : step === "existing_otp"
          ? "3 · Existing builder approve"
          : step === "new_account"
            ? "3 · Create builder account"
            : step === "location"
              ? "4 · Location details"
              : "Completed";

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">
          Builder Onboarding
        </p>
        <h1 className="text-xl font-black text-gray-900 mb-1">
          Approve project
        </h1>
        <p className="text-sm text-gray-600 mb-1">
          Project: <strong>{info?.project?.title}</strong>
          {info?.project?.slug ? (
            <>
              {" · "}
              <Link
                href={`/project/${info.project.slug}?invite=${encodeURIComponent(token)}`}
                className="text-[#27AE60] font-semibold underline"
              >
                View preview
              </Link>
            </>
          ) : null}
        </p>
        <p className="text-xs font-bold text-emerald-700 mb-4">{stepLabel}</p>

        {error ? (
          <p className="text-xs font-semibold text-red-500 mb-3">{error}</p>
        ) : null}

        {step === "contact" && (
          <form onSubmit={onContactNext} className="space-y-3">
            <p className="text-sm text-gray-600">
              First add the project contact person details (who handles this project).
            </p>
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Contact person name *"
              value={form.handlerName}
              onChange={(e) => setForm({ ...form, handlerName: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Contact person phone *"
              value={form.handlerPhone}
              onChange={(e) => setForm({ ...form, handlerPhone: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Contact person email"
              value={form.handlerEmail}
              onChange={(e) => setForm({ ...form, handlerEmail: e.target.value })}
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white"
            >
              Next · Builder mobile
            </button>
          </form>
        )}

        {step === "mobile" && (
          <form onSubmit={onMobileContinue} className="space-y-3">
            <p className="text-sm text-gray-600">
              Enter builder mobile number. If already registered, we will approve this
              project for that account. If not, create-account flow starts.
            </p>
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Builder mobile number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("contact")}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? "Checking…" : "Continue"}
              </button>
            </div>
          </form>
        )}

        {step === "existing_otp" && (
          <form onSubmit={onExistingApprove} className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-bold text-emerald-800">
                You are already registered
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                {existingBuilder?.name || "Builder"}
                {existingBuilder?.companyName
                  ? ` · ${existingBuilder.companyName}`
                  : ""}
                . Verify mobile OTP to approve this project.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={sendLoginOtp}
                disabled={submitting}
                className="rounded-xl border-2 border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-700"
              >
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
              <input
                className="flex-1 rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold tracking-widest"
                placeholder="Enter OTP *"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                required
              />
            </div>
            {otpSent ? (
              <p className="text-xs font-semibold text-emerald-700">
                OTP sent to {form.phone}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Approving…" : "Verify OTP & Approve Project"}
            </button>
          </form>
        )}

        {step === "new_account" && (
          <form onSubmit={onNewAccountVerify} className="space-y-3">
            <p className="text-sm text-gray-600">
              Mobile is new. Create builder account (same as Propenu create credential),
              then finish location and approve.
            </p>
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Company name *"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Official email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold bg-gray-50"
              value={form.phone}
              readOnly
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={sendCreateOtp}
                disabled={submitting}
                className="rounded-xl border-2 border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-700"
              >
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
              <input
                className="flex-1 rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold tracking-widest"
                placeholder="Enter mobile OTP *"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Verify OTP & Continue"}
            </button>
          </form>
        )}

        {step === "location" && (
          <form onSubmit={onLocationFinish} className="space-y-3">
            <p className="text-sm text-gray-600">
              Complete location step (same as builder registration), then project is approved.
            </p>
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="State *"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="City *"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Locality *"
              value={form.locality}
              onChange={(e) => setForm({ ...form, locality: e.target.value })}
              required
            />
            <input
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-semibold"
              placeholder="Pincode *"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Finishing…" : "Finish & Approve Project"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-3 text-center">
            <p className="text-lg font-black text-emerald-700">
              Project approved & onboarded
            </p>
            <p className="text-sm text-gray-600">
              Builder is linked to this project successfully.
            </p>
            <button
              type="button"
              onClick={goToProject}
              className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-bold text-white"
            >
              Open project
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
