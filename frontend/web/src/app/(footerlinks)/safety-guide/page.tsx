"use client";
import React, { useState } from "react";
import { HiHome, HiLockClosed, HiCheckCircle, HiShieldCheck } from "react-icons/hi2";

interface Section {
    id: string;
    title: string;
}

const sections: Section[] = [
    { id: "intro", title: "1. Built on Trust. Designed for Your Protection. " },
    { id: "buyers", title: "2. For Buyers & Tenants" },
    { id: "owners", title: "3. For Owners & Agents" },
    { id: "why-propenu", title: "4. Why Propenu Is Different" },
];

/* ---------- Reusable Section Header ---------- */
function SectionHeader({ id, title }: { id: string; title: string }) {
    return (
        <div id={id} className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-3 border-b border-[#26ad5f]">
                {title}
            </h2>
        </div>
    );
}

const SafetyGuidePage = () => {
    const [activeSection, setActiveSection] = useState<string>("intro");

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="bg-linear-to-b from-white to-gray-50 min-h-screen">
            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Table of Contents - Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Contents
                            </h3>

                            <nav className="space-y-1.5">
                                {sections.map((section) => {
                                    const isActive = activeSection === section.id;

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 ${isActive
                                                ? "bg-white text-[#27A361] font-semibold shadow-sm"
                                                : "text-gray-500 hover:bg-white/60 hover:text-[#27A361]"
                                                }`}
                                        >
                                            {/* Section title */}
                                            <span className="flex-1 text-left truncate">{section.title}</span>

                                            {/* Active indicator dot */}
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#27A361]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-10">
                            {/* Introduction Section */}
                            <section id="intro" className="scroll-mt-20">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Safety Guide
                                </h1>
                                <SectionHeader id="buyers" title="1. Built on Trust. Designed for Your Protection" />{" "}
                                <div className="space-y-4 text-gray-700 leading-relaxed">
                                    <p>
                                        At Propenu, safety is not an afterthought. Every user is
                                        KYC-verified. Every property is screened and approved. Interactions are monitored to help prevent spam and fraud.
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                                            <span className="font-semibold text-sm">
                                                Verified Users
                                            </span>
                                        </div>
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                                            <span className="font-semibold text-sm">
                                                Genuine Properties
                                            </span>
                                        </div>
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                                            <span className="font-semibold text-sm">
                                                No Fake Listings
                                            </span>
                                        </div>
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                                            <span className="font-semibold text-sm">Zero Spam</span>
                                        </div>
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center col-span-2 sm:col-span-1">
                                            <span className="font-semibold text-sm">
                                                Secure Data Handling
                                            </span>
                                        </div>
                                    </div>
                                    <p>
                                        Still, real estate decisions don’t stop at a platform. This
                                        guide exists to help you stay safe even beyond the Propenu
                                        ecosystem.
                                    </p>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-sm">
                                        <p className="font-semibold text-blue-800">
                                            🛡️ Fraud is actively prevented here. This guide is for your
                                            extra protection in the real world.
                                        </p>

                                        <ul className="mt-2 ml-4 list-disc list-inside text-blue-700 text-sm space-y-1">
                                            <li>
                                                While Propenu blocks fake profiles and properties,
                                                caution is important during site visits, meetings, and
                                                transactions outside the platform.
                                            </li>
                                            <li>
                                                That’s why we’ve created safety tips for every type of
                                                user.
                                            </li>
                                        </ul>
                                    </div>
                                </div>{" "}
                            </section>
                            <div className="border-t border-gray-200 pt-8">
                                {" "}
                                {/* Changed section to div for consistent styling */}
                                <SectionHeader id="buyers" title="2. For Buyers & Tenants" />{" "}
                                {/* Updated id and removed icon from title */}
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        Your dream home is close, but stay alert to ensure a smooth
                                        and secure process.
                                    </p>
                                    <ul className="space-y-3">
                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                1. Never Pay Anything Without Seeing the Property
                                            </h4>
                                            <ul className="mt-1 ml-10 list-disc text-sm text-gray-600 space-y-1">
                                                <li>Always visit the property in person.</li>
                                                <li>
                                                    Match the address, photos, and details with what’s
                                                    shared on the listing page.
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                2. Verify Before You Transfer Money
                                            </h4>
                                            <ul className="mt-1 ml-10 list-disc text-sm text-gray-600 space-y-1">
                                                <li>
                                                    Do not send booking amounts, tokens, or deposits
                                                    before document checks.
                                                </li>
                                                <li>
                                                    Be cautious if someone pressures you with urgency or
                                                    limited-time offers.
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                3. Don’t Share Sensitive Documents
                                            </h4>
                                            <ul className="mt-1 ml-10 list-disc text-sm text-gray-600 space-y-1">
                                                <li>
                                                    Avoid sending Aadhaar, PAN, bank details, or OTPs
                                                    unless legally required for a verified transaction.
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-sm mt-4">
                                        <h4 className="font-bold text-red-800">
                                            Watch for Red Flags
                                        </h4>
                                        <ul className="list-disc ml-3 list-inside text-red-700 text-sm space-y-1 mt-2">
                                            <li>
                                                Requests for “registration fees” or “gate passes.”
                                            </li>
                                            <li>Refusal to meet or show original documents.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>{" "}
                            <div className="border-t border-gray-200 pt-8">
                                {" "}
                                <SectionHeader id="owners" title="3. For Owners & Agents" />{" "}
                                <div className="space-y-4 text-gray-700">
                                    <p>
                                        Protect your property and your information from fraudulent
                                        inquiries.
                                    </p>
                                    <ul className="space-y-3">
                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                1. Avoid Fake Buyers or Tenants
                                            </h4>
                                            <p className="text-sm ml-5">Be cautious of people who:</p>

                                            <ul className="mt-1 ml-15 list-disc text-sm text-gray-600 space-y-1">
                                                <li>Refuse to meet in person or avoid site visits</li>
                                                <li>
                                                    Delay decisions while repeatedly asking for documents
                                                </li>
                                                <li>
                                                    Request property papers for vague “loan” or
                                                    “verification” reasons
                                                </li>

                                            </ul>
                                        </li>

                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                2. Never Share Legal or Financial Details
                                            </h4>
                                            <ul className="mt-1 ml-10 list-disc text-sm text-gray-600 space-y-1">
                                                <li>Do not share sale deeds, bank details, or ownership papers unless legally required.</li>
                                            </ul>
                                        </li>
                                        <li>
                                            <h4 className="font-semibold text-gray-800">
                                                3. Report Suspicious Behaviour
                                            </h4>
                                            <ul className="mt-1 ml-10 list-disc text-sm text-gray-600 space-y-1">
                                                <li>
                                                    If someone tries to misuse your listing or documents,
                                                    report them to us immediately.
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>{" "}
                            {/* End of For Owners, Agents & Builders */}
                            {/* Why Propenu Is Different */}
                            <div className="border-t border-gray-200 pt-8">
                                {" "}
                                {/* Changed section to div for consistent styling */}
                                <SectionHeader
                                    id="why-propenu"
                                    title="4. Why Propenu Is Different"
                                />{" "}
                                {/* Updated id and removed icon from title */}
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Unlike traditional portals, Propenu prevents fraud before it
                                        reaches you. You’re not just browsing; you’re operating
                                        inside a trusted ecosystem.
                                    </p>
                                    <ul className="space-y-3 pt-2">
                                        <li className="flex items-start gap-3">
                                            <HiCheckCircle className="mt-1 text-green-500 text-lg shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    KYC-Verified Users Only
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    We confirm the identity of every user so you connect only with real people.
                                                </p>
                                            </div>
                                        </li>

                                        <li className="flex items-start gap-3">
                                            <HiHome className="mt-1 text-green-500 text-lg shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    Screened Properties
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Every property is reviewed by our team to ensure it’s genuine.
                                                </p>
                                            </div>
                                        </li>

                                        <li className="flex items-start gap-3">
                                            <HiShieldCheck className="mt-1 text-green-500 text-lg shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    Zero Spam & No Bots
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Our systems actively block fake listings and suspicious activity.
                                                </p>
                                            </div>
                                        </li>

                                        <li className="flex items-start gap-3">
                                            <HiLockClosed className="mt-1 text-green-500 text-lg shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-gray-800">
                                                    Secure Communication & Data
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Your data is protected and continuously monitored for unusual activity.
                                                </p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>{" "}

                            {/* CTA Section */}
                            {/* Report an Issue CTA */}
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-sm mt-8">
                                <h4 className="font-semibold text-yellow-800 text-lg">
                                    Something Feels Wrong?
                                </h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    If you ever notice misleading information or suspicious behaviour, use{" "}
                                    <span className="font-semibold underline cursor-pointer">
                                        Report an Issue
                                    </span>.
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    We investigate every report to keep Propenu safe for everyone.
                                </p>
                            </div>


                            {/* End of CTA Section */}
                            {/* Footer Section - Added as per PrivacyPolicy UI */}
                            <div className="border-t border-gray-200 mt-8 pt-8">
                                <div className="bg-gray-200 text-black rounded-lg p-6 text-center">
                                    <p>
                                        Your safety is our priority. Thank you for choosing Propenu.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>{" "}
                    {/* End of main content div */}
                </div>{" "}
                {/* End of grid */}
            </div>
        </div>
    );
};

export default SafetyGuidePage;
