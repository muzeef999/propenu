"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import EmailOnboardingShell from "@/components/builder/EmailOnboardingShell";
import OtpFourDigitInput from "@/components/builder/OtpFourDigitInput";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

const OTP_RESEND_SECONDS = 30;

type Step =
  | "invite"
  | "contact"
  | "mobile"
  | "existing_otp"
  | "new_account"
  | "location"
  | "done";

type InviteData = {
  invite: { email?: string; phone?: string; companyName?: string };
  project: {
    title?: string;
    slug?: string;
    city?: string;
    locality?: string;
    state?: string;
    address?: string;
    heroImage?: string;
    heroTagline?: string;
  };
};

type ExistingBuilder = {
  id: string;
  name?: string;
  email?: string;
  companyName?: string;
};

function maskMobile(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const last4 = digits.slice(-4) || "••••";
  return `+91 •••••• ${last4}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold text-[#334155]">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold text-[#0f172a] outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:border-[#27AE60] focus:ring-4 focus:ring-[#27AE60]/15 disabled:bg-gray-50 ${props.className || ""}`}
    />
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#27AE60] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#219150] disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

export default function BuilderOnboardPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [info, setInfo] = useState<InviteData | null>(null);
  const [step, setStep] = useState<Step>("invite");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [isNewBuilderDone, setIsNewBuilderDone] = useState(false);
  const [existingBuilder, setExistingBuilder] = useState<ExistingBuilder | null>(
    null,
  );
  const lastAutoSubmittedOtp = useRef("");

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

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const normalizePhone = (value: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (String(value || "").startsWith("+")) return String(value).trim();
    return digits ? `+${digits}` : "";
  };

  const localPhoneDigits = useMemo(() => {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length > 10) return digits.slice(-10);
    return digits.slice(0, 10);
  }, [form.phone]);

  const locationLine = useMemo(() => {
    const p = info?.project;
    if (!p) return "";
    return [p.locality, p.city, p.state].filter(Boolean).join(", ");
  }, [info]);

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

  const sendLoginOtp = useCallback(async () => {
    setError("");
    setOtpError("");
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
      setResendIn(OTP_RESEND_SECONDS);
      setForm((f) => ({ ...f, otp: "" }));
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  }, [form.phone]);

  const sendCreateOtp = useCallback(async () => {
    setError("");
    setOtpError("");
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
      setResendIn(OTP_RESEND_SECONDS);
      setForm((f) => ({ ...f, otp: "" }));
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  }, [form.phone]);

  // Auto-send OTP when entering existing builder step
  useEffect(() => {
    if (step === "existing_otp" && !otpSent && !submitting) {
      void sendLoginOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const onContactNext = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !form.handlerName.trim() ||
      !form.handlerPhone.trim() ||
      !form.handlerEmail.trim()
    ) {
      setError("Full name, phone number, and email are required");
      return;
    }
    const phone = normalizePhone(form.handlerPhone);
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid contact phone number");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.handlerEmail.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setStep("mobile");
  };

  const onMobileContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const phone = normalizePhone(form.phone);
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid builder mobile number");
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

      setOtpSent(false);
      setOtpVerified(false);
      setForm((f) => ({ ...f, otp: "" }));

      if (json?.data?.exists) {
        setExistingBuilder(json.data.builder);
        setForm((f) => ({
          ...f,
          name: json.data.builder?.name || f.name,
          companyName: json.data.builder?.companyName || f.companyName,
          email: json.data.builder?.email || f.email,
        }));
        setIsNewBuilderDone(false);
        setStep("existing_otp");
      } else {
        setExistingBuilder(null);
        setIsNewBuilderDone(true);
        setStep("new_account");
      }
    } catch (err: any) {
      setError(err?.message || "Phone check failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onExistingApprove = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setOtpError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      if (form.otp.trim().length !== 4) {
        throw new Error("Enter the 4-digit OTP");
      }

      const verifyRes = await fetch(`${apiBase}/api/users/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: form.otp.trim() }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        const msg = verifyJson?.message || "OTP verification failed";
        setOtpError(msg);
        throw new Error(msg);
      }
      if (verifyJson?.token) {
        Cookies.set("token", verifyJson.token, { expires: 7 });
      }

      setOtpVerified(true);
      await claimProject(phone);
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Approve failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onSendCreateOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.companyName.trim() || !form.email.trim()) {
      setError("Fill full name, company name and email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    await sendCreateOtp();
  };

  const onNewAccountVerify = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setOtpError("");
    setSubmitting(true);
    try {
      const phone = normalizePhone(form.phone);
      if (!form.name.trim() || !form.companyName.trim() || !form.email.trim()) {
        throw new Error("Fill name, company name and email");
      }
      if (form.otp.trim().length !== 4) {
        throw new Error("Enter the 4-digit OTP");
      }

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
        const msg = signupJson?.message || "Account create failed";
        setOtpError(msg);
        throw new Error(msg);
      }
      if (signupJson?.token) {
        Cookies.set("token", signupJson.token, { expires: 7 });
      }

      setOtpVerified(true);
      setStep("location");
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

  const changeMobile = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError("");
    setError("");
    setForm((f) => ({ ...f, otp: "" }));
    setResendIn(0);
    setStep("mobile");
  };

  // Auto-submit once when 4 digits are entered (existing / new OTP steps)
  useEffect(() => {
    if (form.otp.length !== 4 || submitting || otpVerified) return;
    if (lastAutoSubmittedOtp.current === form.otp) return;
    if (step === "existing_otp" && otpSent) {
      lastAutoSubmittedOtp.current = form.otp;
      void onExistingApprove();
    }
    if (step === "new_account" && otpSent) {
      lastAutoSubmittedOtp.current = form.otp;
      void onNewAccountVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.otp, step, otpSent]);

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
      <EmailOnboardingShell>
        <div className="flex min-h-[240px] flex-col items-center justify-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-[#27AE60]" />
          <p className="text-sm font-semibold text-gray-600">
            Opening your invitation…
          </p>
        </div>
      </EmailOnboardingShell>
    );
  }

  if (error && !info) {
    return (
      <EmailOnboardingShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <Link href="/" className="text-sm font-bold text-[#27AE60]">
            Go Home
          </Link>
        </div>
      </EmailOnboardingShell>
    );
  }

  return (
    <EmailOnboardingShell>
      {/* FLOW 1 — Invitation */}
      {step === "invite" && (
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#27AE60]">
              Propenu Launch Partner
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0f172a] sm:text-[28px]">
              You&apos;ve been invited!
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Review the project below, then approve to continue onboarding in
              this invite experience.
            </p>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-[#f8faf9]">
            {info?.project?.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.project.heroImage}
                alt={info.project.title || "Project"}
                className="h-40 w-full object-cover sm:h-48"
              />
            ) : (
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#d1fae5] to-[#ecfdf5]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#27AE60]/15 text-2xl text-[#27AE60]">
                  ▦
                </div>
              </div>
            )}
            <div className="space-y-2 p-4 sm:p-5">
              <h2 className="text-lg font-black text-[#0f172a]">
                {info?.project?.title || "Featured Project"}
              </h2>
              {info?.invite?.companyName ? (
                <p className="text-sm font-semibold text-gray-500">
                  By {info.invite.companyName}
                </p>
              ) : null}
              {locationLine ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#27AE60]">
                  <span aria-hidden>📍</span>
                  {locationLine}
                </p>
              ) : null}
              {info?.project?.heroTagline ? (
                <p className="text-sm leading-relaxed text-gray-600">
                  {info.project.heroTagline}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-gray-600">
                  Complimentary onboarding and project activation on Propenu.
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#27AE60] text-[10px] font-black text-white">
                  PR
                </div>
                <p className="text-xs font-semibold text-gray-500">
                  Invited by Propenu Realty
                </p>
              </div>
            </div>
          </div>

          {info?.project?.slug ? (
            <Link
              href={`/project/${info.project.slug}?invite=${encodeURIComponent(token)}`}
              className="block text-center text-sm font-bold text-[#27AE60] underline-offset-2 hover:underline"
            >
              View full project preview
            </Link>
          ) : null}

          <PrimaryButton type="button" onClick={() => setStep("contact")}>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              ✓
            </span>
            Approve
          </PrimaryButton>
          <p className="text-center text-[11px] font-semibold text-gray-400">
            Stays in this invite — continues onboarding below
          </p>
        </div>
      )}

      {/* FLOW 2 — Contact person */}
      {step === "contact" && (
        <form onSubmit={onContactNext} className="space-y-5">
          <div>
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#27AE60] text-xs font-black text-white">
              1
            </div>
            <h2 className="text-xl font-black text-[#0f172a]">
              Project Contact Person
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Please provide the primary project contact details.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <TextInput
                placeholder="Enter full name"
                value={form.handlerName}
                onChange={(e) =>
                  setForm({ ...form, handlerName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <FieldLabel>Phone Number</FieldLabel>
              <TextInput
                placeholder="Enter phone number"
                inputMode="tel"
                value={form.handlerPhone}
                onChange={(e) =>
                  setForm({ ...form, handlerPhone: e.target.value })
                }
                required
              />
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <TextInput
                type="email"
                placeholder="Enter email address"
                value={form.handlerEmail}
                onChange={(e) =>
                  setForm({ ...form, handlerEmail: e.target.value })
                }
                required
              />
            </div>
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          ) : null}

          <PrimaryButton type="submit">Next →</PrimaryButton>
        </form>
      )}

      {/* FLOW 3 — Builder mobile */}
      {step === "mobile" && (
        <form onSubmit={onMobileContinue} className="space-y-5">
          <div>
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#27AE60] text-xs font-black text-white">
              2
            </div>
            <h2 className="text-xl font-black text-[#0f172a]">
              Builder Mobile Number
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter Builder Registered Mobile Number
            </p>
          </div>

          <div>
            <FieldLabel>Mobile Number</FieldLabel>
            <div className="flex overflow-hidden rounded-xl border border-gray-200 focus-within:border-[#27AE60] focus-within:ring-4 focus-within:ring-[#27AE60]/15">
              <span className="flex items-center border-r border-gray-200 bg-[#f8faf9] px-3 text-sm font-bold text-[#0f172a]">
                +91
              </span>
              <input
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={localPhoneDigits}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm({ ...form, phone: digits });
                }}
                className="w-full px-3.5 py-3 text-sm font-semibold text-[#0f172a] outline-none"
                required
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-gray-400">
              We&apos;ll detect Existing Builder or New Builder automatically.
            </p>
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("contact")}
              className="rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-bold text-[#0f172a]"
            >
              Back
            </button>
            <PrimaryButton type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Checking…" : "Continue"}
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* EXISTING BUILDER */}
      {step === "existing_otp" && (
        <form onSubmit={onExistingApprove} className="space-y-5">
          <div className="rounded-[18px] border border-[#a7f3d0] bg-[#ecfdf5] p-4">
            <p className="text-sm font-black text-[#065f46]">Existing Builder</p>
            <p className="mt-0.5 text-xs font-semibold text-[#047857]">
              You are already registered
            </p>
            {existingBuilder?.name || existingBuilder?.companyName ? (
              <p className="mt-2 text-xs font-semibold text-[#065f46]">
                {[existingBuilder?.name, existingBuilder?.companyName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-gray-600">
              Enter the 4-digit OTP sent to your registered mobile number.
            </p>
            <p className="text-xs font-bold text-[#27AE60]">
              {maskMobile(normalizePhone(form.phone))}
            </p>

            <OtpFourDigitInput
              value={form.otp}
              onChange={(otp) => {
                setOtpError("");
                lastAutoSubmittedOtp.current = "";
                setForm({ ...form, otp });
              }}
              disabled={submitting || otpVerified}
              error={Boolean(otpError)}
              autoFocus
            />

            {otpError ? (
              <p className="text-xs font-semibold text-red-500">{otpError}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold">
              {resendIn > 0 ? (
                <span className="text-gray-500">
                  Resend code in 00:{String(resendIn).padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    lastAutoSubmittedOtp.current = "";
                    void sendLoginOtp();
                  }}
                  className="text-[#27AE60] hover:underline"
                >
                  Resend OTP
                </button>
              )}
              <button
                type="button"
                onClick={changeMobile}
                className="text-gray-500 hover:underline"
              >
                Change mobile number
              </button>
            </div>
          </div>

          {error && !otpError ? (
            <p className="text-center text-xs font-semibold text-red-500">
              {error}
            </p>
          ) : null}

          <PrimaryButton
            type="submit"
            disabled={submitting || form.otp.length !== 4}
          >
            {submitting
              ? "Verifying…"
              : "Verify OTP & Approve Project"}
          </PrimaryButton>
        </form>
      )}

      {/* NEW BUILDER */}
      {step === "new_account" && (
        <div className="space-y-5">
          <div className="rounded-[18px] border border-[#a7f3d0] bg-[#ecfdf5] p-4">
            <p className="text-sm font-black text-[#065f46]">New Builder</p>
            <p className="mt-0.5 text-xs font-semibold text-[#047857]">
              Create your Propenu builder account
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={onSendCreateOtp} className="space-y-3">
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <TextInput
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel>Company / Builder Name</FieldLabel>
                <TextInput
                  placeholder="Company name"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <TextInput
                  type="email"
                  placeholder="Official email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel>Mobile Number</FieldLabel>
                <TextInput
                  value={maskMobile(normalizePhone(form.phone))}
                  readOnly
                  disabled
                />
              </div>

              {error ? (
                <p className="text-xs font-semibold text-red-500">{error}</p>
              ) : null}

              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send OTP"}
              </PrimaryButton>
              <button
                type="button"
                onClick={changeMobile}
                className="w-full text-center text-xs font-semibold text-gray-500 hover:underline"
              >
                Change mobile number
              </button>
            </form>
          ) : (
            <form onSubmit={onNewAccountVerify} className="space-y-4">
              <div className="space-y-3 text-center">
                <p className="text-sm font-semibold text-gray-600">
                  We sent a 4-digit verification code to{" "}
                  <span className="font-bold text-[#27AE60]">
                    {maskMobile(normalizePhone(form.phone))}
                  </span>
                </p>

                <OtpFourDigitInput
                  value={form.otp}
                  onChange={(otp) => {
                    setOtpError("");
                    lastAutoSubmittedOtp.current = "";
                    setForm({ ...form, otp });
                  }}
                  disabled={submitting || otpVerified}
                  error={Boolean(otpError)}
                  autoFocus
                />

                {otpVerified ? (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold text-[#065f46]">
                    <span>✓</span> Mobile Verified
                  </p>
                ) : null}

                {otpError ? (
                  <p className="text-xs font-semibold text-red-500">{otpError}</p>
                ) : null}

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold">
                  {resendIn > 0 ? (
                    <span className="text-gray-500">
                      Resend code in 00:{String(resendIn).padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        lastAutoSubmittedOtp.current = "";
                        void sendCreateOtp();
                      }}
                      className="text-[#27AE60] hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={changeMobile}
                    className="text-gray-500 hover:underline"
                  >
                    Change mobile number
                  </button>
                </div>
              </div>

              {error && !otpError ? (
                <p className="text-center text-xs font-semibold text-red-500">
                  {error}
                </p>
              ) : null}

              <PrimaryButton
                type="submit"
                disabled={submitting || form.otp.length !== 4 || otpVerified}
              >
                {submitting ? "Verifying…" : "Verify OTP & Continue"}
              </PrimaryButton>
            </form>
          )}
        </div>
      )}

      {/* NEW BUILDER LOCATION */}
      {step === "location" && (
        <form onSubmit={onLocationFinish} className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold text-[#065f46]">
              ✓ Mobile verified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold text-[#065f46]">
              ✓ Builder details
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-[#0f172a]">
              Location Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Complete your builder location to finish approval.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>State</FieldLabel>
              <TextInput
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
              />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div>
              <FieldLabel>Locality</FieldLabel>
              <TextInput
                placeholder="Locality"
                value={form.locality}
                onChange={(e) =>
                  setForm({ ...form, locality: e.target.value })
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Pincode</FieldLabel>
              <TextInput
                placeholder="Pincode"
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  })
                }
                required
              />
            </div>
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Finishing…" : "Finish & Approve"}
          </PrimaryButton>
        </form>
      )}

      {/* SUCCESS */}
      {step === "done" && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#27AE60] text-3xl font-black text-white shadow-lg shadow-emerald-500/30">
            ✓
          </div>
          <h2 className="text-2xl font-black text-[#0f172a]">
            Project Approved
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            {isNewBuilderDone
              ? "Your account has been created and the project has been successfully approved."
              : "Your project has been successfully approved."}
          </p>
          <div className="mt-6 w-full max-w-xs">
            <PrimaryButton type="button" onClick={goToProject}>
              Continue to project
            </PrimaryButton>
          </div>
        </div>
      )}
    </EmailOnboardingShell>
  );
}
