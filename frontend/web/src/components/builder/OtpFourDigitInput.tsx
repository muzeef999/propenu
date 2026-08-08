"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
};

/** Exactly 4 OTP boxes — Propenu invite onboarding */
export default function OtpFourDigitInput({
  value,
  onChange,
  disabled,
  error,
  autoFocus,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  const digits = (value || "").padEnd(4, " ").slice(0, 4).split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (index: number, char: string) => {
    const next = (value || "").split("");
    while (next.length < 4) next.push("");
    next[index] = char;
    onChange(next.join("").replace(/\s/g, "").slice(0, 4));
  };

  const onKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if ((value[index] || "").trim()) {
        setAt(index, "");
      } else if (index > 0) {
        setAt(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const onInput = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setAt(index, "");
      return;
    }
    if (cleaned.length > 1) {
      const otp = cleaned.slice(0, 4);
      onChange(otp);
      refs.current[Math.min(otp.length, 3)]?.focus();
      return;
    }
    setAt(index, cleaned);
    if (index < 3) refs.current[index + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const otp = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(otp);
    refs.current[Math.min(otp.length, 3)]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3" onPaste={onPaste}>
      {[0, 1, 2, 3].map((index) => {
        const digit = (digits[index] || "").trim();
        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={(e) => onInput(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            className={`h-14 w-12 rounded-xl border-2 bg-white text-center text-xl font-bold text-[#0f172a] outline-none transition
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                  : "border-gray-200 focus:border-[#27AE60] focus:ring-4 focus:ring-[#27AE60]/20"
              }
              disabled:bg-gray-50 disabled:opacity-60`}
            aria-label={`OTP digit ${index + 1} of 4`}
          />
        );
      })}
    </div>
  );
}
