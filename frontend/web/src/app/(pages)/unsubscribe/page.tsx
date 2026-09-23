"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { unsubscribeFromEmail } from "@/data/ClientData";
import { toast } from "sonner";

type PageState = "loading" | "confirm" | "manual" | "success";

function decodeBase64Email(encoded: string): string | null {
  try {
    return atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
}

export default function UnsubscribePage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [identifier, setIdentifier] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const phoneParam = params.get("phone");

    const raw = emailParam || phoneParam;
    if (raw) {
      // Try base64 decode; if it fails or looks like a plain email, use as-is
      const decoded = decodeBase64Email(raw);
      const resolved = decoded && (decoded.includes("@") || decoded.match(/^\+?\d/))
        ? decoded
        : raw;
      setIdentifier(resolved);
      setPageState("confirm");
    } else {
      setPageState("manual");
    }
  }, []);

  const handleUnsubscribe = async (id: string) => {
    setLoading(true);
    try {
      const isEmail = id.includes("@");
      const payload = isEmail ? { email: id } : { phone: id };
      await unsubscribeFromEmail(payload);
      setPageState("success");
      toast.success("You've been unsubscribed.");
      setTimeout(() => router.replace("/"), 5000);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to unsubscribe. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FBFFFD",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid #f0f0f0",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.3px",
            }}
          >
            Propenu
          </span>
          <a
            href="/"
            style={{
              fontSize: "13px",
              color: "#8C8989",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </a>
        </div>

        {/* ── LOADING ── */}
        {pageState === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#8C8989", fontSize: "14px" }}>
            Loading…
          </div>
        )}

        {/* ── CONFIRM (from email link) ── */}
        {pageState === "confirm" && (
          <div style={{ textAlign: "center" }}>
            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(39,174,96,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h1 style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: 700, color: "#111111" }}>
              Unsubscribe from Emails
            </h1>

            <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#8C8989", lineHeight: "1.6" }}>
              You're about to unsubscribe
            </p>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                wordBreak: "break-all",
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "8px 14px",
              }}
            >
              {identifier}
            </p>
            <p style={{ margin: "0 0 28px", fontSize: "13px", color: "#8C8989", lineHeight: "1.7" }}>
              You will no longer receive promotional emails from Propenu. You can re-subscribe at any time from your account settings.
            </p>

            <button
              id="confirm-unsubscribe-btn"
              onClick={() => handleUnsubscribe(identifier)}
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: "10px",
              }}
            >
              {loading ? "Processing…" : "Confirm Unsubscribe"}
            </button>

            <button
              onClick={() => router.replace("/")}
              style={{
                width: "100%",
                padding: "11px 24px",
                background: "transparent",
                color: "#8C8989",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── MANUAL FORM ── */}
        {pageState === "manual" && (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(39,174,96,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h1 style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: 700, color: "#111111", textAlign: "center" }}>
              Unsubscribe from Emails
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#8C8989", lineHeight: "1.7", textAlign: "center" }}>
              Enter your email address or mobile number to stop receiving promotional emails from Propenu.
            </p>

            <label
              htmlFor="manual-identifier"
              style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}
            >
              Email or Mobile Number
            </label>
            <input
              id="manual-identifier"
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="you@example.com or +91 98765 43210"
              className="input-field"
              style={{ marginBottom: "16px", fontSize: "14px" }}
            />

            <button
              id="manual-unsubscribe-btn"
              onClick={() => {
                if (!manualInput.trim()) {
                  toast.error("Please enter your email or mobile number.");
                  return;
                }
                handleUnsubscribe(manualInput.trim());
              }}
              disabled={loading || !manualInput.trim()}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                cursor: loading || !manualInput.trim() ? "not-allowed" : "pointer",
                opacity: loading || !manualInput.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Processing…" : "Unsubscribe"}
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {pageState === "success" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(39,174,96,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1 style={{ margin: "0 0 10px", fontSize: "22px", fontWeight: 700, color: "#111111" }}>
              You're Unsubscribed
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#8C8989", lineHeight: "1.7" }}>
              You've been successfully unsubscribed from Propenu promotional emails.
            </p>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#8C8989" }}>
              Redirecting to home in 5 seconds…
            </p>
            <button
              onClick={() => router.replace("/")}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center", padding: "11px 24px", fontSize: "14px" }}
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}