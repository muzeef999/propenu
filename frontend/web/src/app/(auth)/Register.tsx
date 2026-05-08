"use client"
import KycButton from "@/app/(account)/settings/KycButton";
import {
  createRequestOtp,
  createVerifyOtp,
  me,
  updateKycDetails,
  updateLocation,
} from "@/data/ClientData";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {  MdCheckCircle,  MdClose,  MdOutlineBadge,  MdOutlineLock,} from "react-icons/md";
import { BsBuildings } from "react-icons/bs";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { BsShieldCheck } from "react-icons/bs";
import { HiOutlineIdentification } from "react-icons/hi2";
import Cookies from "js-cookie";
import { AiOutlineUser } from "react-icons/ai";
import {  accountSchema, FormErrors,  locationSchema,  mapAuthZodErrors,  OTP_LENGTH,  otpSchema,  phoneSchema,} from "./AuthZod";

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  initialStep?: "personal" | "location" | "kyc";
  initialKycStatus?: "verified" | "pending" | "rejected" | null;
  initialKycRemark?: string;
}

type RegisterStep = "personal" | "location" | "kyc";

type NominatimPincodeResult = {
  address?: {
    suburb?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
  };
};

function validateFullName(
  name: string,
  role: "user" | "builder" | "agent",
): string {
  const value = name.trim();

  if (!value) return "Full name is required";
  if (value.length < 3) return "Name must be at least 3 characters";

  // 🚨 Only apply strict rules for KYC users
  if (role !== "builder") {
    const words = value.split(" ").filter(Boolean);

    if (words.length < 2) {
      return "Enter full name as per Aadhaar (first + last name)";
    }

    const businessWords = ["construction", "builders", "realty", "infra"];

    if (businessWords.some((word) => value.toLowerCase().includes(word))) {
      return "Please enter your full name as per Aadhaar (not your business name)";
    }
  }

  
  if (/\d/.test(value)) {
    return "Name cannot contain numbers";
  }

  return "";
}

function formatToTitleCase(value: string) {
  if (!value) return "";

  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizePincodeAreaName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^ward\s*\d+[a-z]?\s+/i, "").trim();
}

const tabs: { id: RegisterStep; label: string }[] = [
  { id: "personal", label: "Personal Details" },
  { id: "location", label: "Location" },
  { id: "kyc", label: "KYC Verification" },
];

const RESEND_OTP_SECONDS = 30;

const RegisterDialog = ({
  open,
  onClose,
  onSwitchToLogin,
  initialStep = "personal",
  initialKycStatus = null,
  initialKycRemark = "",
}: RegisterDialogProps) => {

  const [step, setStep] = useState<RegisterStep>(initialStep || "personal");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "builder" | "agent",
    pincode: "",
    locality: "",
    city: "",
    state: "",
  });

  const [kycStatus, setKycStatus] = useState<
    "verified" | "pending" | "rejected" | null
  >(initialKycStatus);

  const [kycRemark, setKycRemark] = useState(initialKycRemark);
  const [isKycEditMode, setIsKycEditMode] = useState(
    initialKycStatus === "rejected" || initialKycStatus === "pending",
  );

  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const otp = otpDigits.join("");
  const isPhoneValid = isValidPhoneNumber(phoneNumber);
  const shouldShowOtpInputs = isPhoneValid && !isOtpVerified;
  const isPersonalDetailsFilled =
    formData.name.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    Boolean(formData.role);
  const isLocationFilled =
    formData.pincode.trim().length === 6 &&
    formData.locality.trim().length > 0 &&
    formData.city.trim().length > 0 &&
    formData.state.trim().length > 0;
  const requiresKyc = formData.role !== "builder";
  const visibleTabs = requiresKyc
    ? tabs
    : tabs.filter((tab) => tab.id !== "kyc");

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastOtpRequestedPhoneRef = useRef("");
  const verifiedPhoneRef = useRef("");

  function normalizePhone(value: string) {
    const validation = phoneSchema.safeParse({ phone: value });
    return validation.success ? validation.data.phone : value;
  }

  function isPreviouslyVerifiedPhone(value: string) {
    const normalizedPhone = normalizePhone(value);
    return (
      Boolean(verifiedPhoneRef.current) &&
      normalizedPhone === verifiedPhoneRef.current
    );
  }

  async function handleRegisterRequest(isResend = false) {
    if (isResend && resendCooldown > 0) return;

    if (isOtpVerified || isPreviouslyVerifiedPhone(phoneNumber)) {
      setIsOtpVerified(true);
      return;
    }

    const validation = phoneSchema.safeParse({ phone: phoneNumber });

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, ...mapAuthZodErrors(validation.error) }));
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, phone: undefined, otp: undefined }));

    try {
      await createRequestOtp({
        phone: validation.data.phone,
      });

      lastOtpRequestedPhoneRef.current = validation.data.phone;
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(RESEND_OTP_SECONDS);
      toast.success(
        isResend
          ? "OTP resent to your WhatsApp number"
          : "OTP sent to your WhatsApp number",
      );
      inputsRef.current[0]?.focus();
    } catch {
      toast.error("Account already exists or something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function saveAuthToken(token?: string) {
    if (!token) return;

    Cookies.set("token", token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    window.dispatchEvent(new Event("auth-changed"));
  }

  async function handlePersonalStepNext() {
    const accountValidation = accountSchema.safeParse(formData);
    const nameError = validateFullName(formData.name, formData.role);

    if (!accountValidation.success || nameError) {
      setErrors((prev) => ({
        ...prev,
        ...(accountValidation.success
          ? {}
          : mapAuthZodErrors(accountValidation.error)),
        ...(nameError ? { name: nameError } : {}),
      }));
      return;
    }

    if (isOtpVerified) {
      if (requiresKyc && isKycEditMode) {
        setLoading(true);

        try {
          const res = await updateKycDetails({
            name: accountValidation.data.name,
            email: accountValidation.data.email,
          });

          saveAuthToken(res?.token);
          toast.success("Personal details updated");
          setStep("location");
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || "Failed to update KYC details",
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      setStep("location");
      return;
    }

    handleVerifyOtp();
  }

  async function handleVerifyOtp() {
    const otpToSubmit = otp;

    const phoneValidation = phoneSchema.safeParse({ phone: phoneNumber });
    const accountValidation = accountSchema.safeParse(formData);
    const otpValidation = otpSchema.safeParse(otpToSubmit);

    if (
      !phoneValidation.success ||
      !accountValidation.success ||
      !otpValidation.success
    ) {
      setErrors((prev) => ({
        ...prev,
        ...(phoneValidation.success
          ? {}
          : mapAuthZodErrors(phoneValidation.error)),
        ...(accountValidation.success
          ? {}
          : mapAuthZodErrors(accountValidation.error)),
        ...(otpValidation.success
          ? {}
          : { otp: otpValidation.error.issues[0]?.message }),
      }));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: accountValidation.data.name,
        email: accountValidation.data.email,
        role: accountValidation.data.role,
        phone: phoneValidation.data.phone,
        otp: otpToSubmit,
      };

      const res = await createVerifyOtp(payload);

      // save token
      saveAuthToken(res?.token);

      verifiedPhoneRef.current = phoneValidation.data.phone;
      setIsOtpVerified(true);

      // move to location step
      setStep("location");

      toast.success("OTP verified successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteLocation() {
    const accountValidation = accountSchema.safeParse(formData);
    const validation = locationSchema.safeParse(formData);
    const nameError = validateFullName(formData.name, formData.role);

    if (!accountValidation.success || !validation.success || nameError) {
      setErrors({
        ...(accountValidation.success
          ? {}
          : mapAuthZodErrors(accountValidation.error)),
        ...(validation.success ? {} : mapAuthZodErrors(validation.error)),
        ...(nameError ? { name: nameError } : {}),
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        locality: validation.data.locality,
        city: validation.data.city,
        state: validation.data.state,
        pincode: validation.data.pincode,
      };

      const res =
        requiresKyc && isKycEditMode
          ? await updateKycDetails({
              name: accountValidation.data.name,
              email: accountValidation.data.email,
              ...payload,
            })
          : await updateLocation(payload);

      saveAuthToken(res?.token);

      if (requiresKyc) {
        if (isKycEditMode) {
          setKycStatus(null);
          setKycRemark("");
          toast.success("Details updated. Please retry KYC.");
        } else {
          toast.success("Location updated");
        }
        setStep("kyc");
        return;
      }

      toast.success("Location updated. Builder account is now active.");
      handleClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isKycEditMode
            ? "Failed to update KYC details"
            : "Failed to update location"),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    setErrors((prev) => ({ ...prev, otp: undefined }));
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otpDigits];
    nextOtp[index] = digit;
    setOtpDigits(nextOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!paste) return;

    const nextOtp = [...otpDigits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      nextOtp[i] = paste[i] ?? "";
    }
    setOtpDigits(nextOtp);
    inputsRef.current[Math.max(paste.length - 1, 0)]?.focus();
  }

  function handleClose() {
    setStep("personal");
    setPhoneNumber("");
    setIsOtpVerified(false);
    setResendCooldown(0);
    setKycStatus(null);
    setKycRemark("");
    setIsKycEditMode(false);
    lastOtpRequestedPhoneRef.current = "";
    verifiedPhoneRef.current = "";
    setFormData({
      name: "",
      email: "",
      role: "user",
      pincode: "",
      locality: "",
      city: "",
      state: "",
    });
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setErrors({});
    onClose();
  }

  function handleTabClick(nextStep: RegisterStep) {
    if (nextStep === "personal") {
      setStep("personal");
      return;
    }

    if (nextStep === "location" && isOtpVerified) {
      setStep("location");
      return;
    }

    if (nextStep === "kyc" && isOtpVerified && requiresKyc) {
      const validation = locationSchema.safeParse(formData);
      if (validation.success) {
        setStep("kyc");
      }
    }
  }

  useEffect(() => {
    if (!open || step !== "personal" || !shouldShowOtpInputs) return;
    if (resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, resendCooldown, shouldShowOtpInputs, step]);

  useEffect(() => {
    if (step !== "personal") return;
    if (!isPhoneValid) return;
    if (isOtpVerified || isPreviouslyVerifiedPhone(phoneNumber)) return;
    if (loading) return;
    if (phoneNumber === lastOtpRequestedPhoneRef.current) return;

    handleRegisterRequest();
  }, [step, isPhoneValid, isOtpVerified, phoneNumber, loading]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        const user = data?.user;

        if (!user) return;

        // fill phone
        setPhoneNumber(user.phone || "");
        verifiedPhoneRef.current =
          user.phoneVerified && user.phone ? normalizePhone(user.phone) : "";

        // fill form fields
        setFormData((prev) => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          role:
            user.roleName === "builder" || user.roleName === "agent"
              ? user.roleName
              : "user",
          pincode: user.pincode || "",
          locality: user.locality || "",
          city: user.city || "",
          state: user.state || "",
        }));

        // important: user already verified OTP
        setIsOtpVerified(Boolean(user.phoneVerified));

        if (user.kyc?.status === "rejected" || user.kyc?.status === "pending") {
          setKycStatus(user.kyc.status);
          setKycRemark(user.kyc?.remarks || initialKycRemark || "");
          setIsKycEditMode(true);
        } else if (
          user.roleName !== "builder" &&
          (user.accountStatus === "kyc_pending" ||
            user.accountStatus === "kyc_rejected" ||
            initialStep === "kyc")
        ) {
          setIsKycEditMode(true);
        }
      } catch (err) {
        console.log("Failed to fetch user");
      }
    }

    if (open) {
      fetchUser();
    }
  }, [open, initialKycRemark]);

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
  }, [initialStep, open]);

  useEffect(() => {
    if (!open) return;

    setKycStatus(initialKycStatus);
    setKycRemark(initialKycRemark);
    setIsKycEditMode(
      initialKycStatus === "rejected" || initialKycStatus === "pending",
    );

    if (initialKycStatus === "rejected" || initialKycStatus === "pending") {
      setStep("kyc");
    }
  }, [initialKycRemark, initialKycStatus, open]);


  useEffect(() => {
  const kyc = sessionStorage.getItem("kycStatus");
  const remark = sessionStorage.getItem("kycRemark");

  if (kyc === "rejected" || kyc === "pending") {
    setKycStatus(kyc as any);
    setKycRemark(remark || "");
    setStep("kyc");

    // reopen dialog
    // IMPORTANT
    if (!open) {
      onSwitchToLogin(); // remove if unnecessary
    }

    sessionStorage.removeItem("kycStatus");
    sessionStorage.removeItem("kycRemark");
  }
}, []);


  useEffect(() => {
    if (step !== "location") return;

    const pincode = formData.pincode.replace(/\D/g, "");

    if (pincode.length !== 6) {
      setIsLookingUpPincode(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsLookingUpPincode(true);

      try {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&addressdetails=1&limit=1&accept-language=en`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en",
          },
        });

        if (!res.ok) {
          console.error("Pincode lookup failed:", res.status);
          return;
        }

        const data: NominatimPincodeResult[] = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          setErrors((prev) => ({
            ...prev,
            pincode: "Couldn't find location details for this pincode.",
          }));
          return;
        }

        const address = data[0]?.address;
        if (!address) return;

        const locality = formatToTitleCase(
          normalizePincodeAreaName(
            address.suburb ||
              address.neighbourhood ||
              address.hamlet ||
              address.village ||
              address.town ||
              address.city_district ||
              address.county ||
              "",
          ),
        );

        const city = formatToTitleCase(
          address.city ||
            address.town ||
            address.village ||
            address.city_district ||
            address.state_district ||
            address.county ||
            "",
        );

        const state = formatToTitleCase(address.state || "");

        setFormData((prev) => ({
          ...prev,
          locality: locality || prev.locality,
          city: city || prev.city,
          state: state || prev.state,
        }));

        setErrors((prev) => ({
          ...prev,
          pincode: undefined,
          locality: locality ? undefined : prev.locality,
          city: city ? undefined : prev.city,
          state: state ? undefined : prev.state,
        }));
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;

        console.error("Pincode lookup error:", err);
      } finally {
        setIsLookingUpPincode(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
      setIsLookingUpPincode(false);
    };
  }, [formData.pincode, step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-[440px] overflow-hidden rounded-xl bg-[#f2fcf6]  shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-1 cursor-pointer text-[#8d908e] transition-colors hover:text-[#5e635f]"
          aria-label="Close"
        >
          <MdClose size={22} />
        </button>

        <div className="p-6 pb-3">
          <h2 className="pr-10 text-2xl font-medium leading-none text-[#28b463]">
            Create an Account
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#7f8481]">
            Provide your personal details to create your account
          </p>

          <div className="mt-3 flex justify-between gap-6 text-[0.9rem]">
            {visibleTabs.map((tab) => {
              const isActive = step === tab.id;
              const isCompleted =
                (tab.id === "personal" && isPersonalDetailsFilled) ||
                (tab.id === "location" && isLocationFilled);
              const isEnabled =
                tab.id === "personal" ||
                (tab.id === "location" && isOtpVerified) ||
                (tab.id === "kyc" && isOtpVerified && requiresKyc);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  disabled={!isEnabled}
                  className={`border-b-2 pb-2 text-center transition cursor-pointer ${
                    isCompleted
                      ? "border-[#1c7b44] text-[#1f8f4d]"
                      : isActive
                        ? "border-[#28b463] text-[#28b463]"
                        : "border-[#b6b8b6] text-[#8d908e]"
                  } ${!isEnabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-t-[26px] bg-[#ffffff] px-6 py-6 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
          {step === "personal" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-normal text-[#1e1e1e]">
                  Are you
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      value: "user",
                      label: "Buyer/Seller",
                      icon: AiOutlineUser,
                    },
                    { value: "agent", label: "Agent", icon: MdOutlineBadge },
                    { value: "builder", label: "Builder", icon: BsBuildings },
                  ].map(({ value, label, icon: Icon }) => {
                    const isActive = formData.role === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            role: value as "user" | "builder" | "agent",
                          }));
                          setErrors((prev) => ({ ...prev, role: undefined }));
                        }}
                        className={`flex min-h-[46px] items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition cursor-pointer ${
                          isActive
                            ? "border-[#28b463] bg-[#f2fcf6]  text-[#28b463]"
                            : "border-transparent bg-[#f2fcf6]  text-[#8a8d8b]"
                        }`}
                      >
                        <Icon size={20} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.role && (
                  <p className="mt-2 text-xs text-red-600">{errors.role}</p>
                )}
              </div>
              <div>
                <label className="font-normal text-[#1e1e1e]">Full Name </label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name: value,
                      }));
                      const error = validateFullName(value, formData.role);
                      setErrors((prev) => ({
                        ...prev,
                        name: error || undefined,
                      }));
                    }}
                    placeholder="Enter your full name"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="font-normal text-[#1e1e1e]">
                  Mobile{" "}
                  <span className="text-sm font-normal text-[#9ca09d]">
                    (aadhaar linked mobile number)
                  </span>
                </label>

                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-0.5">
                  <div className="phone-material flex items-center gap-3">
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      value={phoneNumber}
                      onChange={(value) => {
                        const nextPhone = value || "";
                        const isSameVerifiedPhone =
                          isPreviouslyVerifiedPhone(nextPhone);

                        setPhoneNumber(nextPhone);
                        setErrors((prev) => ({
                          ...prev,
                          phone: undefined,
                          otp: undefined,
                        }));
                        setOtpDigits(Array(OTP_LENGTH).fill(""));
                        setResendCooldown(0);
                        setIsOtpVerified(isSameVerifiedPhone);
                      }}
                      placeholder="Enter your mobile number"
                      className="w-full"
                    />
                    {isOtpVerified && (
                      <MdCheckCircle className="shrink-0 text-[1.6rem] text-[#28b463]" />
                    )}
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}

                {shouldShowOtpInputs && (
                  <div className="mt-3">
                    <p className="mb-2 font-normal text-[#1e1e1e]">
                      Enter WhatsApp OTP
                    </p>
                    <div className="flex  gap-3" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputsRef.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(e.target.value, index)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="h-10 w-10 rounded-md border border-[#d8ded9] bg-white text-center text-lg font-semibold text-[#1f1f1f] outline-none transition focus:border-[#28b463] focus:ring-2 focus:ring-[#cfead8]"
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="mt-2 text-center text-xs text-red-600">
                        {errors.otp}
                      </p>
                    )}
                    <div className="mt-3 text-center text-xs text-[#7f8481]">
                      {resendCooldown > 0 ? (
                        <p>Resend OTP in {resendCooldown}s</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRegisterRequest(true)}
                          disabled={loading}
                          className="cursor-pointer font-medium text-[#28b463] hover:underline disabled:cursor-not-allowed disabled:text-[#9aa39e] disabled:no-underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-normal text-[#1e1e1e]">Mail ID</label>
                <div className="mt-2 rounded-md bg-[#f2fcf6]  px-4 py-2.5">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Enter your mail id"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <button
                disabled={loading}
                onClick={handlePersonalStepNext}
                className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  "Verifying..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Continue
                  </span>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-[#7f8481]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin();
                    }}
                    className="cursor-pointer font-medium text-[#28b463] hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-4">
              <div>
                <label className="font-medium text-[#1e1e1e]">Pincode</label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.pincode}
                    onChange={(e) => {
                      const nextPincode = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setFormData((prev) => ({
                        ...prev,
                        pincode: nextPincode,
                        ...(nextPincode.length < 6
                          ? {
                              locality: "",
                              city: "",
                              state: "",
                            }
                          : {}),
                      }));
                      setErrors((prev) => ({ ...prev, pincode: undefined }));
                    }}
                    placeholder="Enter pincode"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>
                )}
                {!errors.pincode && isLookingUpPincode && (
                  <p className="mt-1 text-xs text-[#7f8481]">
                    Fetching locality, city, and state...
                  </p>
                )}
              </div>

              <div>
                <label className=" font-medium text-[#1e1e1e]">Locality</label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        locality: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, locality: undefined }));
                    }}
                    placeholder="Enter locality"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.locality && (
                  <p className="mt-1 text-xs text-red-600">{errors.locality}</p>
                )}
              </div>

              <div>
                <label className="font-medium text-[#1e1e1e]">City</label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, city: undefined }));
                    }}
                    placeholder="Enter city"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="font-medium text-[#1e1e1e]">State</label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, state: undefined }));
                    }}
                    placeholder="Enter state"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("personal")}
                  className="w-full rounded-lg border border-[#c8ceca] py-2.5 text-base font-semibold text-[#6b706d] transition hover:bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCompleteLocation}
                  className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === "kyc" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-medium leading-none text-[#1f1f1f]">
                  Verify with DigiLocker
                </h3>
                <div className="mt-5 rounded-md bg-[#f2fcf6] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-base font-medium text-[#1f1f1f]">
                      {phoneNumber || "-"}
                    </div>
                    <MdCheckCircle className="shrink-0 text-[1.6rem] text-[#28b463]" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#8b8f8c]">
                  This number will be used for KYC verification
                </p>
              </div>
              {kycStatus === "rejected" ? (
                <div className="relative rounded-xl bg-[#fdeaea] p-5 border border-red-200">
                  {/* Icon (top-right) */}
                  <div className="absolute top-4 right-4 text-red-300 text-4xl">
                    <HiOutlineIdentification />
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-red-600">
                    KYC Verification Failed
                  </h2>

                  {/* Subtitle */}
                  <p className="text-gray-700 mt-1">
                    We couldn’t verify your identity
                  </p>

                  {/* Reason */}
                  <p className="mt-2 text-sm">
                    <span className="text-red-500 font-semibold">Reason:</span>{" "}
                    <span className="text-gray-700">
                      {kycRemark || "Name mismatch with Aadhaar card."}
                    </span>
                  </p>

                  {/* Divider */}
                  <div className="border-t border-dashed border-red-200 my-4"></div>

                  {/* How to resolve */}
                  <h3 className="text-red-600 font-semibold mb-2">
                    How to resolve:
                  </h3>

                  <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                    <li>Enter your full name as per your Aadhaar.</li>
                    <li>Do not use business or company names.</li>
                    <li>Check spellings carefully before submitting.</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="space-y-2 py-1">
                    {[
                      "Real users, verified identities",
                      "One-time KYC verification",
                      "Safe & secure platform",
                      "Zero spam & fake accounts",
                      "Connect with genuine leads",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <MdCheckCircle className="shrink-0 text-lg text-[#28b463]" />
                        <span className="text-[1.02rem] text-[#1f1f1f]">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-5 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-green-600 text-xl mt-0.5">
                    <BsShieldCheck />
                  </div>

                  {/* Text */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Your data is safe and secure with DigiLocker
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      We don’t store your documents
                    </p>
                  </div>
                </div>
              </div>
              {kycStatus == "rejected" ? (
                <button
                  onClick={() => {
                    setErrors({});
                    setStep("personal");
                  }}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Update Details
                </button>
              ) : (
                <div className="pt-2">
                  <KycButton className="w-full text-center" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;
