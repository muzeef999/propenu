"use client";

import React, { useMemo, useState } from "react";
import FaqsSvg from "@/svg/FaqsSvg";
import {
    IoCallOutline,
    IoChevronDown,
    IoLogoWhatsapp,
    IoMailOutline,
} from "react-icons/io5";
import Accordion, { AccordionItem } from "@/ui/Accordion";

const SUPPORT_EMAIL = "support@propenu.com";
const SUPPORT_PHONE = "+919182334233";
const SUPPORT_WHATSAPP_MESSAGE = encodeURIComponent(
    "Hello Propenu support, I need help with my account/listing.",
);

interface FaqQuestion {
    id: string;
    question: string;
    answer: React.ReactNode;
}

interface FaqSubcategory {
    id: string;
    title: string;
    faqs: FaqQuestion[];
}

interface FaqCategory {
    id: string;
    title: string;
    subtitle: string;
    subcategories: FaqSubcategory[];
}

const FAQ_DATA: FaqCategory[] = [
    {
        id: "1",
        title: "FAQs",
        subtitle: "Core support layer",
        subcategories: [
            {
                id: "1-1",
                title: "General FAQs",
                faqs: [
                    {
                        id: "1-1-1",
                        question: "Do I need to create an account to post my property?",
                        answer:
                            "Yes. You'll need to sign up or log in to create and manage your property listing. This helps us keep your information secure and makes sure only you can update or respond to inquiries.",
                    },
                    {
                        id: "1-1-2",
                        question:
                            "How long does it take for my property to go live after posting?",
                        answer:
                            "After you submit your property details, the listing goes through a verification process. Property verification is typically completed within 24 hours, after which the property is published on the platform. In rare cases, verification may take longer than 24 hours due to additional checks or incomplete information. You will be notified once your property is approved and goes live.",
                    },
                    {
                        id: "1-1-3",
                        question: "Can I list my property for free on Propenu?",
                        answer:
                            "Yes. Property owners, agents, and builders can post a limited number of properties for free on Propenu. To list more than this limit, a subscription is required.",
                    },
                    {
                        id: "1-1-4",
                        question:
                            "What is top search visibility, and why should I upgrade?",
                        answer:
                            "Top search visibility places your property higher in relevant search results. This increases exposure, brings more enquiries, and helps close deals faster.",
                    },
                    {
                        id: "1-1-5",
                        question: "Does Propenu require KYC to register on Propenu?",
                        answer:
                            "Yes. All users on Propenu, including buyers, tenants, property owners, agents, and builders, must complete KYC verification. This helps create a trusted and secure platform for all users.",
                    },
                    {
                        id: "1-1-6",
                        question:
                            "Is property verification mandatory to list a property on Propenu?",
                        answer:
                            "Yes. Property owners, agents, and builders must complete property verification before listing a property on Propenu. This process helps ensure listing authenticity, prevents fraudulent listings, builds buyer trust, and maintains a transparent real estate ecosystem.",
                    },
                    {
                        id: "1-1-7",
                        question: "How does Propenu prevent spam or fake leads?",
                        answer:
                            "Propenu uses advanced AI-based filtering along with verification checks to detect and reduce spam, fake enquiries, suspicious activity, and fraudulent listings. This ensures property owners receive higher-quality leads while keeping user interactions secure and reliable.",
                    },
                    {
                        id: "1-1-8",
                        question: "Can I edit or update my listing after submission?",
                        answer:
                            "Absolutely. You can log into your dashboard at any time to edit details, including address, images, pricing, or deactivation. Any changes made will go through verification again before being reflected live on the platform.",
                    },
                    {
                        id: "1-1-9",
                        question:
                            "What kind of support can I expect as a property owner?",
                        answer:
                            "Propenu offers end-to-end support to property owners, from posting a property to managing enquiries and closing deals. The team helps you through listing, verification, and visibility options to ensure a smooth experience.",
                    },
                    {
                        id: "1-1-10",
                        question: "What types of properties can I list on Propenu?",
                        answer:
                            "Propenu supports listings for residential properties, commercial properties, plots or lands, and agricultural properties through a simple and transparent listing process.",
                    },
                    {
                        id: "1-1-11",
                        question: "Who can list properties on Propenu?",
                        answer:
                            "Property owners, authorized agents, and builders can list properties on Propenu, subject to successful KYC and property verification.",
                    },
                    {
                        id: "1-1-12",
                        question: "Is Propenu available across India?",
                        answer:
                            "Propenu is currently launching in select cities. Availability will expand to more locations across India as the platform grows.",
                    },
                ],
            },
            {
                id: "1-2",
                title: "Buyer FAQs",
                faqs: [
                    {
                        id: "1-2-1",
                        question:
                            "Do I need to complete KYC to enquire about a property?",
                        answer:
                            "Yes. Buyers must complete KYC verification to contact property owners, agents, or builders on Propenu. This ensures genuine interactions and a trusted experience for all users.",
                    },
                    {
                        id: "1-2-2",
                        question: "Are all properties listed on Propenu verified?",
                        answer:
                            "Yes. All properties listed on Propenu are verified before being published, ensuring authenticity and preventing fraudulent listings across the platform.",
                    },
                    {
                        id: "1-2-3",
                        question:
                            "Is Propenu involved in negotiations or transactions?",
                        answer:
                            "No. Propenu is a technology platform that connects buyers directly with property owners, agents, or builders. All discussions, negotiations, and transactions happen directly between the involved parties.",
                    },
                    {
                        id: "1-2-4",
                        question:
                            "Is there any cost for buyers to contact property owners?",
                        answer:
                            "Buyers can contact a limited number of property owners for free. To contact more than the free limit, a subscription is required.",
                    },
                    {
                        id: "1-2-5",
                        question: "How does Propenu ensure my privacy as a buyer?",
                        answer:
                            "Buyer contact details are shared only when they choose to contact a property owner, agent, or builder. Propenu follows strict data protection practices to safeguard user information.",
                    },
                ],
            },
            {
                id: "1-3",
                title: "Owner FAQs",
                faqs: [
                    {
                        id: "1-3-1",
                        question:
                            "Do I need to complete KYC to list my property on Propenu?",
                        answer:
                            "Yes. Property owners must complete KYC verification to list a property on Propenu. This helps maintain a trusted and transparent platform.",
                    },
                    {
                        id: "1-3-2",
                        question: "Is property verification mandatory before listing?",
                        answer:
                            "Yes. All properties listed on Propenu are verified before being published, ensuring authenticity and preventing fraudulent listings across the platform.",
                    },
                    {
                        id: "1-3-3",
                        question: "Is it free for owners to list a property on Propenu?",
                        answer:
                            "Yes. Property owners can list a limited number of properties for free on Propenu. To list more than this limit, a subscription is required.",
                    },
                    {
                        id: "1-3-4",
                        question: "Can I edit or deactivate my listing after it goes live?",
                        answer:
                            "Yes. Owners can manage listings at any time through their dashboard, including editing details and updating pricing. Owners can also deactivate listings whenever required.",
                    },
                    {
                        id: "1-3-5",
                        question: "How do buyer enquiries work for owners?",
                        answer:
                            "Owners can receive and respond to enquiries from verified buyers. A limited number of enquiries can be accessed for free. To view or respond to additional enquiries beyond this limit, a subscription is required.",
                    },
                ],
            },
            {
                id: "1-4",
                title: "Tenant FAQs",
                faqs: [
                    {
                        id: "1-4-1",
                        question: "Do tenants need to complete KYC on Propenu?",
                        answer:
                            "Yes. Tenants must complete KYC verification to contact property owners or agents on Propenu. This helps ensure genuine and secure interactions.",
                    },
                    {
                        id: "1-4-2",
                        question: "Are rental properties listed on Propenu verified?",
                        answer:
                            "Yes. All properties listed on Propenu are verified before being published, ensuring authenticity and preventing fraudulent listings across the platform.",
                    },
                    {
                        id: "1-4-3",
                        question:
                            "Is there any cost for tenants to contact property owners?",
                        answer:
                            "Tenants can contact a limited number of property owners for free. To contact more than the free limit, a subscription is required.",
                    },
                    {
                        id: "1-4-4",
                        question: "Does Propenu act as a broker for rental properties?",
                        answer:
                            "No. Propenu is a technology platform that connects tenants directly with property owners or agents. Propenu does not participate in negotiations.",
                    },
                    {
                        id: "1-4-5",
                        question: "How does Propenu protect tenant privacy?",
                        answer:
                            "Tenant contact details are shared only when they choose to contact a property owner or agent. Propenu follows strict data protection practices to safeguard user information.",
                    },
                ],
            },
            {
                id: "1-5",
                title: "Agent/Builder FAQs",
                faqs: [
                    {
                        id: "1-5-1",
                        question: "Do agents and builders need to complete KYC on Propenu?",
                        answer:
                            "Yes. All agents and builders must complete KYC verification to list properties on Propenu. This ensures a trusted and transparent platform.",
                    },
                    {
                        id: "1-5-2",
                        question:
                            "Is property verification mandatory for agents and builders?",
                        answer:
                            "Yes. Every property listed by an agent or builder must undergo property verification before being published on Propenu.",
                    },
                    {
                        id: "1-5-3",
                        question:
                            "Can agents and builders list multiple properties on Propenu?",
                        answer:
                            "Yes. Agents and builders can list a limited number of properties. Once properties listed under a subscription are rented or sold, the remaining subscription validity cannot be transferred to another property. A new subscription is required.",
                    },
                    {
                        id: "1-5-4",
                        question: "Are listings free for agents and builders?",
                        answer:
                            "Yes. Agents and builders can list a limited number of properties for free on Propenu. To list more than this limit, a subscription is required.",
                    },
                    {
                        id: "1-5-5",
                        question:
                            "How do enquiries from buyers and tenants work for agents and builders?",
                        answer:
                            "Agents and builders can receive and respond to enquiries from verified buyers and tenants. A limited number of enquiries can be accessed for free. To view or respond to additional enquiries beyond this limit, a subscription is required.",
                    },
                ],
            },
        ],
    },
    {
        id: "2",
        title: "How Propenu Works",
        subtitle: "Explains the platform clearly",
        subcategories: [
            {
                id: "2-1",
                title: "How listing & searching works",
                faqs: [
                    {
    id: "2-1-1",
    question: "How listing & searching works",
    answer: (
        <>
            <strong>
                Buyers, tenants, property owners, agents, and builders
            </strong>{" "}
            can use Propenu after completing KYC verification. Property owners, agents, and builders can list properties after completing property verification. Once verified, listings go live and are visible to buyers and tenants.
            
            <br />
            <br />

            Buyers and tenants can search using filters such as location, budget, property type, and purpose (buy or rent). They can view verified listings and contact owners, agents, or builders directly through the platform.
        </>
    ),
},

                ],
            },
            {
                id: "2-2",
                title: "Enquiries & Responses",
                faqs: [
                    {
                        id: "2-2-1",
                        question: "Enquiries & Responses",
                        answer:
                            "Buyers and tenants can send enquiries after completing KYC verification. Users can contact a limited number of property owners for free, and additional enquiries require a subscription.\n\n Property owners, agents, and builders can receive a limited number of enquiries for free. To receive more enquiries beyond this limit, a subscription is required. All enquiries are received in the user dashboard, where owners, agents, and builders can view, respond, and manage conversations directly through the platform.",
                    },
                ],
            },
            {
                id: "2-3",
                title: "Verification Overview",
                faqs: [
                    {
                        id: "2-3-1",
                        question: "Verification Overview",
                        answer:
                            "Propenu follows a strict verification process to ensure trust and authenticity on the platform. All users are required to complete KYC verification to access platform features.\n\nIn addition, every property listed on Propenu undergoes property verification before being published. This process helps ensure listing authenticity, prevents fraudulent listings, builds buyer trust, and maintains a transparent real estate ecosystem.",
                    },
                ],
            },
            {
                id: "2-4",
                title: "Verified vs non-verified listings",
                faqs: [
                    {
                        id: "2-4-1",
                        question: "Verified vs non-verified listings",
                        answer:
                            "Propenu publishes only verified property listings on the platform. There are no non-verified listings available for users to view or contact.\n\nThis ensures authenticity and preventing fraudulent listings across the platform. ",
                    },
                ],
            },
        ],
    },
    {
        id: "3",
        title: "Account & Profile Help",
        subtitle: "Important, agreed",
        subcategories: [
            {
                id: "3-1",
                title: "Creating an account",
                faqs: [
                    {
                        id: "3-1-1",
                        question: "Creating an account",
                        answer:
                            "To use Propenu’s features, users must create an account by signing up with a valid mobile number, email address. During registration, users are required to complete KYC verification to access platform services.\n\n Once registered, users can log in to their account, manage their profile, and use features relevant to their role—buyer, tenant, property owner, agent, or builder.",
                    },
                ],
            },
            {
                id: "3-2",
                title: "Login / OTP issues",
                faqs: [
                    {
                        id: "3-2-1",
                        question: "Login / OTP issues",
                        answer:
                            "If you’re unable to log in or not receiving an OTP, ensure that the mobile number or email address entered is correct and active. Check your network connection and allow a few moments for the OTP to arrive.\n\n If the issue persists, try requesting the OTP again or contact Propenu support for assistance.",
                    },
                ],
            },
            {
                id: "3-3",
                title: "Updating profile details",
                faqs: [
                    {
                        id: "3-3-1",
                        question: "Updating profile details",
                        answer:
                            "You can update your profile details at any time by logging into your Propenu account and accessing the profile or account settings section. This includes updating your name, contact information, and other relevant details. \n\nKeeping your profile information accurate helps ensure smooth communication and a better experience on the platform.",
                    },
                ],
            },
            {
                id: "3-4",
                title: "Account deactivation / deletion",
                faqs: [
                    {
                        id: "3-4-1",
                        question: "Account deactivation / deletion",
                        answer:
                            "To deactivate your Propenu account, follow these steps:\n1. Log in to your Propenu account.\n2. Go to Account Settings or Profile Settings.\n3. Select the Deactivate Account option.\n4. Confirm your request when prompted.\n\nOnce deactivated, your profile and listings will no longer be visible on the platform. If you need further assistance, you can contact Propenu support.",
                    },
                ],
            },
            {
                id: "3-5",
                title: "Account Re-activation",
                faqs: [
                    {
                        id: "3-5-1",
                        question: "Account Re-activation",
                        answer:
                            "If your Propenu account has been deactivated, you can request re-activation by contacting the Propenu support team. Reach out via the registered email address or phone number associated with your account.\n\n Once your request is reviewed and verified, your account will be re-activated, and you will regain access to your profile and listings using the same subscription that was active before deactivating your account.",
                    },
                ],
            },
        ],
    },
    {
        id: "4",
        title: "Verification & Trust",
        subtitle: "Propenu's USP",
        subcategories: [
            {
                id: "4-1",
                title: "Property verification process",
                faqs: [
                    {
                        id: "4-1-1",
                        question: "Property Verification Process",
                        answer:
                            "Before a property is listed on Propenu, it must go through a property verification process. Owners, agents, and builders are required to submit relevant property details and supporting documents for review. \n\nThe Propenu team verifies the submitted information to confirm authenticity. Once the verification is completed successfully, the property is approved and published on the platform.",
                    },
                ],
            },
            {
                id: "4-2",
                title: "Documents required",
                faqs: [
                    {
                        id: "4-2-1",
                        question: "Documents required",
                        answer: (
                            <div>
                                <p className="mb-3">
                                    To complete property verification, upload <strong>any one</strong> of the following:
                                </p>

                                <ul className="list-disc space-y-2 pl-5 text-[#4b5a53]">
                                    <li>Encumbrance Certificate</li>
                                    <li>Municipal Tax Receipt</li>
                                    <li>Water Bill or Electricity Bill</li>
                                    <li>Sale Deed</li>
                                </ul>

                                <p className="mt-3">
                                    Submitting any one of these documents is sufficient to proceed with the verification process.
                                </p>
                            </div>
                        ),
                    },

                ],
            },
            {
                id: "4-3",
                title: "Timelines & status",
                faqs: [
                    {
                        id: "4-3-1",
                        question: "Timelines & status",
                        answer:
                            "Property verification is typically completed within 24 hours of document submission. Once approved, the property listing goes live on the platform.\n\nIn rare cases, verification may take longer than 24 hours due to additional checks or incomplete information. You will be notified about the verification status through your dashboard, email address.",
                    },
                ],
            },
            {
                id: "4-4",
                title: "Rejection reasons",
                faqs: [
                    {
                        id: "4-4-1",
                        question: "Rejection reasons",
                        answer:
                            "Verification may be rejected if the submitted user (KYC) details or property documents are incomplete, unclear, invalid, or do not match the information provided.\n\nIf verification is rejected, the reason will be shown in your dashboard and sent to your registered email address. You can update or resubmit the required details for review.",
                    },
                ],
            },
        ],
    },
    {
        id: "5",
        title: "Subscriptions & Payments",
        subtitle: "High-impact, high-queries",
        subcategories: [
            {
                id: "5-1",
                title: "Plans & pricing",
                faqs: [
                    {
                        id: "5-1-1",
                        question: "Plans & pricing",
                        answer:
                            "Propenu offers subscription plans based on user needs and property usage. Owners, agents, and builders can post a limited number of properties for free on Propenu. To list more than this limit, a subscription is required.\n\nSubscriptions provide access to additional features such as increased visibility and extended enquiry access.",
                    },
                ],
            },
            {
                id: "5-2",
                title: "Subscription Usage & Property Limits",
                faqs: [
                    {
                        id: "5-2-1",
                        question: "Subscription Usage & Property Limits",
                        answer:
                            "Each Propenu subscription allows a limited number of properties. Once the properties listed under a subscription are rented or sold, the remaining subscription validity cannot be transferred to another property.\n\nFor example, if an owner, agent, or builder takes a one-month subscription and the listed properties are rented or sold within 15 days, the remaining subscription period cannot be transferred to another property. A new subscription is required to list a new property.\n\nThis policy applies uniformly to property owners, agents, and builders, ensuring fair usage across the platform.",
                    },
                ],
            },
            {
                id: "5-3",
                title: "Validity & expiry",
                faqs: [
                    {
                        id: "5-3-1",
                        question: "Validity & expiry",
                        answer:
                            "Each subscription on Propenu is valid for the duration specified at the time of purchase (e.g., one month). The subscription period starts from the date it is activated for a specific property.\n\nOnce the subscription expires, the associated property will no longer receive subscription benefits such as enhanced visibility or extended enquiry access. Users must renew or purchase a new subscription to continue benefiting from these features.",
                    },
                ],
            },
            {
                id: "5-4",
                title: "Refund & billing",
                faqs: [
                    {
                        id: "5-4-1",
                        question: "Refund & billing",
                        answer:
                            "All subscription payments on Propenu are processed securely through the platform. Subscription fees are non-refundable once the payment is completed.\n\nUsers can view their subscription history in the dashboard, which shows all past and active subscriptions.",
                    },
                ],
            },
        ],
    },
    {
        id: "6",
        title: "Contact Support",
        subtitle: "Final safety net",
        subcategories: [
            {
                id: "6-1",
                title: "Support channels",
                faqs: [
                    {
                        id: "6-1-1",
                        question: "Support channels",
                        answer: (
                            <div>
                                <p className="mb-3">
                                    If you need assistance, you can reach the Propenu support team through the following channels:
                                </p>

                                <ul className="list-disc pl-5 space-y-2 marker:text-[#27AE60]">
                                    <li>
                                        <strong>Email:</strong> Send your queries to our support email address.
                                    </li>
                                    <li>
                                        <strong>Helpline Number:</strong> Call our support helpline for direct assistance.
                                    </li>
                                </ul>

                                <p className="mt-3">
                                    Our team will respond and help resolve your issue as quickly as possible.
                                </p>
                            </div>
                        ),
                    },
                ],
            },
            {
                id: "6-2",
                title: "Response timelines",
                faqs: [
                    {
                        id: "6-2-1",
                        question: "What are support response timelines?",
                        answer: (
                            <div>
                                <p className="mb-3">
                                    The Propenu support team strives to respond to all queries as quickly as possible.
                                </p>

                                <ul className="list-disc pl-5 space-y-2 marker:text-[#27AE60]">
                                    <li>
                                        <strong>Email:</strong> Typically within 24–48 hours.
                                    </li>
                                    <li>
                                        <strong>Helpline Number:</strong> Immediate assistance during support hours.
                                    </li>
                                </ul>

                                <p className="mt-3">
                                    In rare cases, response times may take longer due to unforeseen circumstances, but the team will make every effort to address your concerns promptly.
                                </p>
                            </div>
                        ),
                    },

                ],
            },
        ],
    },

];

const Page = () => {
    const [activeCategory, setActiveCategory] = useState("1");
    const [activeSubcategory, setActiveSubcategory] = useState("1-1");

    const selectedCategory = useMemo(
        () => FAQ_DATA.find((cat) => cat.id === activeCategory) || FAQ_DATA[0],
        [activeCategory]
    );

    const selectedSubcategory = useMemo(
        () =>
            selectedCategory.subcategories.find((sub) => sub.id === activeSubcategory) ||
            selectedCategory.subcategories[0],
        [selectedCategory, activeSubcategory]
    );

    const questionItems: AccordionItem[] = selectedSubcategory.faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer:
            typeof faq.answer === "string" ? (
                <div className="whitespace-pre-line">{faq.answer}</div>
            ) : (
                faq.answer
            ),
    }));

    return (
        <div className="container mx-auto w-full space-y-6 p-3">
            <div
                style={{
                    background:
                        "linear-gradient(120deg, #F9FFFC 0%, #C6F7DC 60%, #A8EFCB 100%)",
                }}
                className="mx-auto w-full rounded-xl border border-[#cbf1de] px-5 py-6"
            >
                <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                    <div className="max-w-7xl">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#27AE60]" />
                            <span className="text-sm font-medium text-[#2f3c36]">FAQs</span>
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[#2f2f2f]">
                            Hello, we are here to help you!
                        </h1>
                        <p className="mb-8 text-sm text-[#6f7a74]">
                            These are the most commonly asked questions to us
                        </p>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            <a
                                href={`tel:${SUPPORT_PHONE}`}
                                className="flex items-center gap-2 text-[#1f2d27] hover:opacity-80"
                            >
                                <IoCallOutline className="text-lg text-[#27AE60]" />
                                <span className="text-sm font-medium">Contact Us</span>
                            </a>
                            <a
                                href={`https://wa.me/${SUPPORT_PHONE.replace(/\D/g, "")}?text=${SUPPORT_WHATSAPP_MESSAGE}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#1f2d27] hover:opacity-80"
                            >
                                <IoLogoWhatsapp className="text-lg text-[#27AE60]" />
                                <span className="text-sm font-medium">WhatsApp</span>
                            </a>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="flex items-center gap-2 text-[#1f2d27] hover:opacity-80"
                            >
                                <IoMailOutline className="text-lg text-[#27AE60]" />
                                <span className="text-sm font-medium">{SUPPORT_EMAIL}</span>
                            </a>
                        </div>
                    </div>
                    <div className="mx-auto w-28 md:mx-0 md:w-40 lg:w-44">
                        <FaqsSvg />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
                <aside className="w-full md:w-1/3 lg:w-1/4 md:sticky md:top-6 h-fit">
                    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                        {FAQ_DATA.map((category) => {
                            const isCategoryActive = activeCategory === category.id;

                            return (
                                <div
                                    key={category.id}
                                    className="mb-2 rounded-xl transition-all duration-300"
                                >
                                    {/* CATEGORY BUTTON */}
                                    <button
                                        onClick={() => {
                                            setActiveCategory(category.id);
                                            setActiveSubcategory(category.subcategories[0].id);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-4 py-4 text-left transition-all duration-300 cursor-pointer ${isCategoryActive
                                            ? "bg-[#f4f8f6] text-[#27AE60] shadow-sm"
                                            : "text-[#2f2f2f] hover:bg-gray-50"
                                            }`}
                                    >
                                        <p className="text-base font-semibold tracking-tight">
                                            {category.title}
                                        </p>

                                        <IoChevronDown
                                            className={`text-base transition-transform duration-300 ${isCategoryActive
                                                ? "rotate-180 text-[#27AE60]"
                                                : "text-gray-400"
                                                }`}
                                        />
                                    </button>

                                    {/* SUBCATEGORY SECTION */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isCategoryActive
                                            ? "mt-2 max-h-96 opacity-100"
                                            : "max-h-0 opacity-0"
                                            }`}
                                    >
                                        <div className="space-y-1 px-3 pb-3">
                                            {category.subcategories.map((sub) => {
                                                const isSubActive = sub.id === activeSubcategory;

                                                return (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setActiveSubcategory(sub.id)}
                                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 cursor-pointer capitalize ${isSubActive
                                                            ? " text-[#1e8b4b] font-medium"
                                                            : "text-[#4b5a53] hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {sub.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>


                <main className="flex-1 md:sticky md:top-6 h-[calc(100vh-2rem)]">
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm h-full overflow-y-auto">
                        <Accordion
                            key={selectedSubcategory.id}
                            items={questionItems}
                        />
                    </div>
                </main>


            </div>
        </div>
    );
};

export default Page;
