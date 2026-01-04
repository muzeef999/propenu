"use client";

import { useState } from "react";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";

type AuthMode = "login" | "register" | null;

export default function AuthModalController() {
  const [mode, setMode] = useState<AuthMode>(null);

  const handleClose = () => {
    setMode(null);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setMode("login")}
        className="rounded-md bg-green-600 px-4 py-2 text-white"
      >
        Login
      </button>

      {/* LOGIN */}
      {mode === "login" && (
        <LoginDialog
          open={true}
          onClose={handleClose}
          onSwitchToRegister={() => {
            setMode("register");
          }}
        />
      )}

      {/* REGISTER */}
      {mode === "register" && (
        <RegisterDialog
          open={true}
          onClose={handleClose}
          onSwitchToLogin={() => {
            setMode("login");
          }}
        />
      )}
    </>
  );
}
