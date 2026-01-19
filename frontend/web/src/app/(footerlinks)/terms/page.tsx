"use client";

import Logo from "@/animations/Logo";
import Link from "next/link";
import React, { useState } from "react";

interface Section {
    id: string;
    title: string;
}

const sections: Section[] = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "accounts", title: "2. User Accounts" },
    { id: "listings", title: "3. Listings & Content" },
    { id: "ads", title: "4. Ads & Sponsored Listings" },
    { id: "ip", title: "5. Intellectual Property" },
    { id: "leads", title: "6. Lead Management & Analytics" },
    { id: "fees", title: "7. Fees and Payments" },
    { id: "privacy", title: "8. Privacy" },
    { id: "prohibited", title: "9. Prohibited Activities" },
    { id: "disclaimer", title: "10. Disclaimers & Liability" },
    { id: "termination", title: "11. Termination" },
    { id: "governing", title: "12. Governing Law or Jurisdiction" },
    { id: "changes", title: "13. Changes to Terms" },
];

/* ---------- Reusable Section Header ---------- */
function SectionHeader({ id, title }: { id: string; title: string }) {
    return (
        <div id={id} className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-3 border-b-2 border-[#D4AF37]">
                {title}
            </h2>
        </div>
    );
}

/* ---------- Terms Page ---------- */
const Terms = () => {
    const [activeSection, setActiveSection] = useState<string>("acceptance");

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="bg-linear-to-b from-white to-gray-50 min-h-screen">
            {/* Top Brand Header */}
            <div className="py-6 bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 flex justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-3 select-none"
                        aria-label="Go to homepage"
                    >
                        <div className="w-10 h-10">
                            <Logo />
                        </div>

                        <span className="text-xl sm:text-xl font-semibold text-primary tracking-tight">
                            PROPENU
                            <sup className="ml-1 text-[12px] font-normal align-super text-[#646464]">
                                TM
                            </sup>
                        </span>
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className=" px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Table of Contents - Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 max-h-[calc(90vh-120px)] overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Contents</h3>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeSection === section.id
                                            ? "bg-[#D4AF37] text-gray-900"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
                            {/* Introduction Section */}
                            <div className="border-b border-gray-200 pb-8">
                                <div className="space-y-4 text-gray-700 leading-relaxed">
                                    <p className="text-lg font-semibold text-gray-900">Welcome to Propenu</p>
                                    <p>
                                        By accessing or using our platform, you agree to these Terms &amp; Conditions
                                        and our Privacy Policy. Please read carefully.
                                    </p>
                                    <p>
                                        These Terms &amp; Conditions ("Terms") govern your access to and use of
                                        the Propenu website, mobile application, and all related features,
                                        tools, and services (collectively referred to as the "Platform" or
                                        "Services").
                                    </p>
                                    <p>
                                        Propenu ("we", "our", "us") provides a technology-driven real estate
                                        platform that enables users to list, search, discover, and enquire
                                        about properties, and to communicate with other users including
                                        buyers, sellers, owners, agents, builders, and developers.
                                    </p>
                                    <p>
                                        By accessing, browsing, registering on, or using the Propenu
                                        Platform or Services, you agree to be bound by these Terms, along
                                        with our Privacy Policy and any other applicable policies. If you do
                                        not agree to these Terms, you should not access or use the Platform
                                        or Services.
                                    </p>
                                    <p>
                                        These Terms apply to all users of the Platform, including but not
                                        limited to owners, buyers, sellers, landlords, tenants, agents,
                                        builders, developers, advertisers, and general website visitors.
                                    </p>
                                    <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                        Propenu reserves the right to modify or update these Terms at any
                                        time. Changes will be effective upon posting on the Platform, and
                                        continued use of the Services constitutes acceptance of the updated
                                        Terms.
                                    </p>
                                </div>
                            </div>

                            {/* Section 1: Acceptance of Terms */}
                            <SectionHeader id="acceptance" title="1. Acceptance of Terms" />
                            <div className="space-y-3 text-gray-700">
                                <p>
                                    By accessing or using the Propenu Platform or Services, you agree to
                                    be bound by these Terms & Conditions and all applicable policies,
                                    including the Privacy Policy.
                                </p>
                                <p>
                                    If you do not agree to these Terms, you must not access or use the
                                    Platform.
                                </p>
                                <p>
                                    Your continued use of Propenu after any updates or changes to these
                                    Terms constitutes your acceptance of the revised Terms.
                                </p>
                            </div>

                            {/* Section 2: User Accounts */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="accounts" title="2. User Accounts" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Some features of the Propenu Platform require users to create an
                                        account. Users must provide accurate, current, and complete
                                        information during registration and keep their account details
                                        updated.
                                    </p>
                                    <p>
                                        You are responsible for maintaining the confidentiality of
                                        your login credentials and for all activities carried out under your
                                        account. Users may choose to deactivate their account at any time.
                                    </p>
                                    <p>
                                        Propenu is not responsible for any loss or damage resulting from
                                        unauthorized access to your account due to your failure to secure
                                        your credentials.
                                    </p>
                                    <p className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                        Propenu reserves the right to suspend, restrict,
                                        or terminate accounts that violate these Terms, applicable laws, or
                                        engage in fraudulent, misleading, or harmful activities.
                                    </p>
                                </div>
                            </div>

                            {/* Section 3: Listings & Content */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="listings" title="3. Listings & Content" />
                                <div className="space-y-3 text-gray-700">
                                    <p className="font-semibold text-gray-900">Key Requirements:</p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex gap-2">
                                            <span className="text-[#D4AF37] font-bold">•</span>
                                            <span>Users may create, upload, and manage property listings on the Propenu Platform</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#D4AF37] font-bold">•</span>
                                            <span>All listings must contain accurate, complete, lawful, and up-to-date information</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#D4AF37] font-bold">•</span>
                                            <span>Propenu follows a KYC-based verification process and applies verification checks to reduce spam and fraud</span>
                                        </li>
                                    </ul>
                                    <p className="pt-2">
                                        While Propenu takes reasonable steps to verify users and listings, the
                                        responsibility for accuracy, legality, and validity remains with the user who posts it.
                                    </p>

                                    <p>
                                        Users must ensure that their listings do not infringe any third-party rights, including ownership, contractual, or intellectual property rights.

                                    </p>
                                    <p>
                                        Propenu is not a party to any transaction between users and does not guarantee the outcome, completion, or quality of any property deal arising from listings on the Platform.

                                    </p>

                                    <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                        Propenu may review, approve, modify, restrict, or remove any listing or content that violates these Terms, applicable laws, or platform policies, or that is misleading, incomplete, or harmful.
                                    </p>
                                </div>
                            </div>

                            {/* Section 4: Ads & Sponsored Listings */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="ads" title="4. Ads & Sponsored Listings" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Propenu may display advertisements, promoted content, sponsored
                                        listings, banners, or featured placements across the Platform.
                                    </p>
                                    <p>
                                        Sponsored or promoted listings may receive higher visibility, such as
                                        priority placement in search results, locality pages, or homepage
                                        sections.
                                    </p>
                                    <p>
                                        Advertisers may include owners, agents, builders, developers, banks,
                                        or other real estate–related service providers.
                                    </p>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded space-y-2">
                                        <p className="font-semibold">Important Notice:</p>
                                        <p>Participation in paid promotions or sponsored placements does not
                                            guarantee leads, enquiries, or transaction outcomes.</p>
                                        <p>Propenu does not endorse or guarantee the accuracy, quality, or legality of any advertised or sponsored content, including advertisements from banks or service providers</p>
                                        <p>
                                            Users acknowledge that sponsored content is part of Propenu’s business model and agree to the display of such content while using the Platform.

                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Intellectual Property */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="ip" title="5. Intellectual Property" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        All content, software, design, logos, trademarks, and materials
                                        available on the Propenu Platform are owned by or licensed to
                                        Propenu, unless stated otherwise.
                                    </p>
                                    <p>
                                        Users are granted a limited, non-exclusive, non-transferable right to
                                        access and use the Platform for personal or business purposes in
                                        accordance with these Terms.
                                    </p>
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                        <p className="font-semibold mb-2">Prohibited Actions:</p>
                                        <ul className="space-y-1 ml-4 text-sm">
                                            <li>• Users must not copy, reproduce, modify, distribute, sell, or create derivative works from any part of the Platform without prior written permission from Propenu.
                                            </li>
                                            <li>• Use of Propenu’s name, logo, branding, or trademarks without authorization is strictly prohibited</li>
                                        </ul>
                                    </div>
                                    <p>
                                        Any feedback, suggestions, or ideas shared with Propenu may be used
                                        by Propenu without obligation or compensation to the user.
                                    </p>
                                </div>
                            </div>

                            {/* Section 6: Lead Management & Analytics */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="leads" title="6. Lead Management & Analytics" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Propenu provides tools that allow users to receive, view, manage, and
                                        respond to enquiries or leads generated through the Platform.
                                    </p>
                                    <p>
                                        Analytics and insights may be provided to help users understand
                                        listing performance, engagement, and response activity.
                                    </p>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                        <p className="font-semibold mb-2">Your Responsibilities:</p>
                                        <ul className="space-y-1 ml-4 text-sm">
                                            <li>• Lead and analytics data is provided only for the user’s internal use in relation to their listings or business</li>
                                            <li>• Users must not share, sell, distribute, or misuse lead data or analytics information without proper consent or legal basis.
                                            </li>
                                            <li>• Decisions made based on leads or analytics are the sole responsibility of the user</li>
                                        </ul>
                                    </div>
                                    <p>
                                        Propenu does not guarantee the volume of leads, user intent, or conversion outcomes, and analytics data reflects user interactions and trends, not guaranteed results.
                                    </p>
                                </div>
                            </div>

                            {/* Section 7: Fees and Payments */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="fees" title="7. Fees and Payments" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Certain features or services on Propenu may require payment,
                                        including subscription plans or promotional services.
                                    </p>
                                    <p>
                                        All applicable fees, pricing, and payment terms will be clearly
                                        communicated at the time of purchase.
                                    </p>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded space-y-2">
                                        <p><strong>Subscription Details:</strong></p>
                                        <ul className="space-y-1 ml-4 text-sm">
                                            <li>• Fees paid are non-refundable, unless otherwise stated in a specific refund or cancellation policy</li>
                                            <li>• Users agree to pay all fees associated with the services they choose to use.</li>
                                            <li>• A subscription is valid for one property only and is non-transferable to another property or another user; once the listed property is sold or rented, the remaining subscription period cannot be reused and a new subscription will be required for new property.</li>
                                            <li>• Failure to complete payment may result in restricted access, suspension, or termination of paid features or services.</li>
                                        </ul>
                                    </div>
                                    <p>
                                        Propenu reserves the right to modify pricing, subscription plans, or
                                        payment structures, with prior notice where applicable.
                                    </p>
                                </div>
                            </div>

                            {/* Section 8: Privacy */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="privacy" title="8. Privacy" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Propenu respects user privacy and is committed to protecting personal
                                        data.
                                    </p>
                                    <p>
                                        The collection, use, storage, and processing of personal information
                                        is governed by Propenu's Privacy Policy.
                                    </p>
                                    <p>
                                        By using the Propenu Platform, users consent to the handling of their
                                        information in accordance with the Privacy Policy.
                                    </p>
                                    <p className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                                        Users are encouraged to review the Privacy Policy to understand how
                                        their data is managed and protected.
                                    </p>
                                </div>
                            </div>

                            {/* Section 9: Prohibited Activities */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="prohibited" title="9. Prohibited Activities" />
                                <div className="space-y-3 text-gray-700">
                                    <p className="font-semibold text-gray-900 mb-3">
                                        Users agree not to engage in any of the following activities:
                                    </p>
                                    <div className="space-y-2 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                        <ul className="space-y-2 ml-4">
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Posting false, misleading, fraudulent, or unlawful property information or content.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Using the Platform for any illegal purpose or in violation of applicable laws or regulations.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Attempting to hack, disrupt, damage, or interfere with the Platform, servers, networks, or security systems.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Misusing, copying, scraping, selling, or distributing Platform data, leads, or content without authorization.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Impersonating another person, entity, or misrepresenting identity or authority.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Uploading content that infringes third-party rights, including ownership, contractual, or intellectual property rights.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Using automated tools, bots, or scripts to access or interact with the Platform without permission.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="text-red-600 font-bold">✗</span>
                                                <span>Engaging in abusive, harmful, defamatory, or offensive behaviour toward other users or Propenu.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Section 10: Disclaimers & Liability */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="disclaimer" title="10. Disclaimers & Liability" />
                                <div className="space-y-3 text-gray-700">
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded space-y-2">
                                        <p className="font-semibold">Limitation of Liability:</p>
                                        <p>
                                            Propenu provides the Platform and Services on an "as is" and "as
                                            available" basis without warranties of any kind.
                                        </p>
                                        <p>
                                            To the maximum extent permitted by law, Propenu shall not be liable
                                            for any direct, indirect, incidental, consequential, or special
                                            damages arising out of the use or inability to use the Platform.
                                        </p>
                                    </div>
                                    <p>
                                        Propenu does not guarantee uninterrupted access, error-free
                                        operation, or specific results from using the Platform.
                                    </p>
                                    <p>
                                        Propenu is not responsible for any losses, damages, delays, or
                                        disputes arising from interactions or transactions between users.
                                    </p>
                                    <p>Property listings, analytics, leads, and other content are provided for informational purposes only.</p>
                                    <p className="font-semibold text-gray-900">
                                        Users acknowledge and agree that they are solely responsible for
                                        their use of the Platform.
                                    </p>
                                </div>
                            </div>

                            {/* Section 11: Termination */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="termination" title="11. Termination" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Propenu may suspend or terminate a user's account if the user
                                        violates these Terms, applicable laws, or platform policies.
                                    </p>
                                    <p>
                                        Accounts may also be restricted or terminated in cases of
                                        fraudulent, misleading, abusive, or harmful activities.
                                    </p>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                        <p>
                                            Users may deactivate their account at any time, and Propenu may terminate accounts for policy violations; in either case, any obligations or responsibilities that arose while the account was active will continue to apply.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 12: Governing Law */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="governing" title="12. Governing Law or Jurisdiction" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        These Terms & Conditions shall be governed by and interpreted in
                                        accordance with the laws of India.
                                    </p>
                                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                                        <p className="font-semibold mb-2">Jurisdiction:</p>
                                        <p>
                                            All disputes, claims, or legal proceedings arising out of or
                                            relating to the use of the Propenu Platform or Services shall be
                                            subject to the exclusive jurisdiction of the courts located in
                                            Hyderabad, Telangana, India.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 13: Changes to Terms */}
                            <div className="border-t border-gray-200 pt-8">
                                <SectionHeader id="changes" title="13. Changes to Terms" />
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        Propenu may update or modify these Terms & Conditions from time to
                                        time.
                                    </p>
                                    <p>
                                        Any changes will be effective once posted on the Platform with a
                                        revised effective date.
                                    </p>
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded space-y-2">
                                        <p>
                                            Continued use of the Propenu Platform after such changes constitutes
                                            acceptance of the updated Terms.
                                        </p>
                                        <p> Users are encouraged to review
                                            these Terms periodically to stay informed.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="border-t border-gray-200 mt-8 pt-8">
                                <div className="bg-gray-200 text-black rounded-lg p-6 text-center">
                                    <p>
                                        If you have questions about these Terms & Conditions, please contact us.
                                    </p>
                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
