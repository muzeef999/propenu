"use client";
import Logo from "@/animations/Logo";
import { ArrowDropdownIcon } from "@/icons/icons";
import type { DropdownProps } from "@/ui/SingleDropDown";
import dynamic from "next/dynamic";
import { useState } from "react";

const Dropdown = dynamic<DropdownProps>(
  () => import("@/ui/SingleDropDown"),
  { ssr: false }
);

const Navbar = () => {

    const [isOpen, setIsOpen] = useState(true);


    const pPrimeItems = [
    { id: "pp-1", label: "Dashboard", onClick: () => console.log("Go to Dashboard") },
    { id: "pp-2", label: "Analytics", onClick: () => console.log("Go to Analytics") },
    { id: "pp-3", label: "Settings", onClick: () => console.log("Open Settings") },
  ];

  const loginItems = [
    { id: "lg-1", label: "Sign in", onClick: () => console.log("Sign in clicked") },
    { id: "lg-2", label: "Sign up", onClick: () => console.log("Sign up clicked") },
    { id: "lg-3", label: "Forgot password", onClick: () => console.log("Forgot") },
  ];


  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
             <div className="w-6 h-6">
            <Logo />
            </div>
            <span className="text-2xl text-primary font-bold">
              PROPENU
            </span>
          </div>
          <span className="ml-4 text-sm text-gray-500 hidden sm:inline">
            Hyderabad
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6 text-gray-700 font-medium">
          <Dropdown
        buttonContent={<span>P Prime <ArrowDropdownIcon className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}/></span>}
        items={pPrimeItems}
        align="right"
      />
          <Dropdown 
        buttonContent={<span>Login <ArrowDropdownIcon className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}/></span>}
        items={loginItems}
        align="right"
      />

          <button className="btn btn-secondary">
            Post Property <span className="bg-[#27AE60] text-white rounded-md p-1">Free</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
