"use client";

import Logo from "@/animations/Logo";
import Link from "next/link";
import React, { useState } from "react";

interface Section {
  id: string;
  title: string;
}

const sections: Section[] = [
  { id: "info-collect", title: "1. Information We Collect" },
  { id: "info-use", title: "2. How We Use Your Information" },
  { id: "info-share", title: "3. Sharing of Information" },
  { id: "cookies", title: "4. Cookies & Tracking Technologies" },
  { id: "security", title: "5. Data Protection & Security" },
  { id: "rights", title: "6. User Rights & Choices" },
  { id: "retention", title: "7. Data Retention" },
  { id: "third-party", title: "8. Third-Party Links" },
  { id: "children", title: "9. Children’s Privacy" },
  { id: "changes", title: "10. Changes to This Policy" },
  { id: "contact", title: "11. Contact Information" },
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

/* ---------- Privacy Policy Page ---------- */
const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState<string>("info-collect");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-linear-to-b from-white to-gray-50 min-h-screen">
    

      {/* Main Content Area */}
      <div className=" px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contents</h3>

              <nav className="space-y-1.5">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200
              ${
                isActive
                  ? "bg-white text-[#27A361] font-semibold shadow-sm"
                  : "text-gray-500 hover:bg-white/60 hover:text-[#27A361]"
              }
            `}
                    >
                      {/* Section title */}
                      <span className="flex-1 text-left">{section.title}</span>

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
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
              {/* Introduction Section */}
              <div className="border-b border-gray-200 pb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Privacy Policy
                </h1>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Propenu (“we”, “our”, “us”) respects your privacy and is
                    committed to protecting and responsibly managing the
                    personal data you share with us. We recognize the importance
                    of safeguarding your information and ensuring transparency
                    in how it is collected, used, stored, and disclosed.
                  </p>
                  <p>
                    This Privacy Policy (“Policy”) governs your access to and
                    use of the Propenu website, mobile application, and all
                    related features, tools, and services (collectively referred
                    to as the “Platform” or “Services”). This Policy explains
                    how Propenu collects, processes, stores, shares, and
                    protects personal data when you browse the Platform, create
                    an account, list properties, submit enquiries, communicate
                    with other users, or otherwise use our Services.
                  </p>
                  <p>
                    This Policy applies to all users of the Platform, including
                    but not limited to buyers, sellers, owners, landlords,
                    tenants, agents, builders, developers, and general website
                    visitors.
                  </p>
                  <p>
                    For the purposes of this Policy, “Personal Data” means any
                    information that identifies or can reasonably be used to
                    identify an individual, either directly or indirectly.
                  </p>
                  <p>
                    By accessing, browsing, registering on, or using the Propenu
                    Platform or Services, or by providing your information
                    through any means, you consent to the collection, use,
                    processing, storage, disclosure, and transfer of your
                    Personal Data in accordance with this Privacy Policy. Where
                    required by applicable law, Propenu may seek your explicit
                    consent for processing Personal Data for specific purposes.
                  </p>
                  <p>
                    This Privacy Policy should be read together with our{" "}
                    <Link
                      href="/terms"
                      className="text-emerald-600 hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and any other applicable policies. Capitalized terms not
                    defined herein shall have the meanings assigned to them in
                    the Terms & Conditions.
                  </p>
                  <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    If you do not agree with this Privacy Policy, please refrain
                    from accessing or using the Propenu Platform or Services.
                  </p>
                </div>
              </div>

              {/* Section 1: Information We Collect */}
              <SectionHeader
                id="info-collect"
                title="1. Information We Collect"
              />
              <div className="space-y-4 text-gray-700">
                <p className="font-semibold text-gray-800">
                  1.1 Personal Information
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>Name, email, phone number</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>City/area, buyer or seller preferences</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>
                      Information entered in forms, enquiries, or messages
                    </span>
                  </li>
                </ul>
                <p className="font-semibold text-gray-800">1.2 Usage Data</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>
                      Search filters, viewed listings, visit durations, user
                      behaviour
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>Interaction patterns on listings and pages</span>
                  </li>
                </ul>
                <p className="font-semibold text-gray-800">
                  1.3 Technical & Device Data
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>
                      IP address, browser type, device model, operating system
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>Log data, crash reports, and analytics data</span>
                  </li>
                </ul>
                <p className="font-semibold text-gray-800">
                  1.4 Uploaded Documents
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>
                      Documents voluntarily provided by users for verification
                      or profile setup, where applicable.
                    </span>
                  </li>
                </ul>
                <p className="font-semibold text-gray-800">
                  1.5 Communication Data
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#D4AF37] font-bold">•</span>
                    <span>
                      Messages, enquiry logs, and Calls initiated via Propenu
                      (where applicable)
                    </span>
                  </li>
                </ul>
              </div>

              {/* Section 2: How We Use Your Information */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader
                  id="info-use"
                  title="2. How We Use Your Information"
                />
                <div className="space-y-3 text-gray-700">
                  <p>Propenu uses your information to:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>
                        Deliver property search results and platform services
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>
                        Facilitate communication between buyers, sellers,
                        owners, and agents
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>
                        Send alerts, updates, confirmations, and support
                        messages
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Improve features, performance, and security</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>
                        Personalise recommendations and search results
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Prevent fraud, misuse, or suspicious activity</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Meet legal or regulatory requirements</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 3: Sharing of Information */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader
                  id="info-share"
                  title="3. Sharing of Information"
                />
                <div className="space-y-3 text-gray-700">
                  <p>We may share data with:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>
                        Owners/Agents/Developers when you submit enquiries
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>
                        Trusted third-party partners (hosting, analytics,
                        messaging, support tools)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Legal authorities when required by law</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>
                        Other users when you voluntarily share your details via
                        forms
                      </span>
                    </li>
                  </ul>
                  <p className="pt-2 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    We do not sell or trade user data outside Propenu.
                  </p>
                </div>
              </div>

              {/* Section 4: Cookies & Tracking Technologies */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader
                  id="cookies"
                  title="4. Cookies & Tracking Technologies"
                />
                <div className="space-y-3 text-gray-700">
                  <p>Propenu uses cookies, pixels, and analytics tools to:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Improve loading speed and performance</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Analyse usage and interactions</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Remember user preferences</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Deliver personalised content</span>
                    </li>
                  </ul>
                  <p className="pt-2">
                    Users may disable cookies, but certain features may not work
                    properly.
                  </p>
                </div>
              </div>

              {/* Section 5: Data Protection & Security */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader
                  id="security"
                  title="5. Data Protection & Security"
                />
                <div className="space-y-3 text-gray-700">
                  <p>
                    We take reasonable administrative and technical measures to
                    protect your information.
                  </p>
                  <p className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    However, no online system can guarantee complete security,
                    and users acknowledge this limitation.
                  </p>
                </div>
              </div>

              {/* Section 6: User Rights & Choices */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader id="rights" title="6. User Rights & Choices" />
                <div className="space-y-3 text-gray-700">
                  <p>Depending on applicable laws, you may:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Access your stored information</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Request corrections or updates</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Request account or data deletion</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Opt out of marketing emails</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Change cookie and tracking preferences</span>
                    </li>
                  </ul>
                  <p className="pt-2">
                    Contact us if you wish to exercise any of these rights.
                  </p>
                </div>
              </div>

              {/* Section 7: Data Retention */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader id="retention" title="7. Data Retention" />
                <div className="space-y-3 text-gray-700">
                  <p>We retain information only as long as necessary to:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Provide services</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Resolve disputes</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#D4AF37] font-bold">•</span>
                      <span>Comply with legal obligations</span>
                    </li>
                  </ul>
                  <p className="pt-2">
                    Anonymised data may be retained for analytics and product
                    improvement.
                  </p>
                </div>
              </div>

              {/* Section 8: Third-Party Links */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader id="third-party" title="8. Third-Party Links" />
                <div className="space-y-3 text-gray-700">
                  <p>Propenu may contain links to external sites.</p>
                  <p>
                    We are not responsible for their privacy practices or
                    content.
                  </p>
                  <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    We encourage users to review third-party policies before
                    sharing information.
                  </p>
                </div>
              </div>

              {/* Section 9: Children’s Privacy */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader id="children" title="9. Children’s Privacy" />
                <div className="space-y-3 text-gray-700">
                  <p>
                    Propenu is intended for users aged 18+. We do not knowingly
                    collect data from minors, and users under 18 should not use
                    the platform or submit personal information.
                  </p>
                </div>
              </div>

              {/* Section 10: Changes to This Policy */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader
                  id="changes"
                  title="10. Changes to This Policy"
                />
                <div className="space-y-3 text-gray-700">
                  <p>
                    Propenu may update this Privacy Policy from time to time.
                  </p>
                  <p>Changes will be posted with a revised Effective Date.</p>
                  <p className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    Continued use of Propenu implies acceptance of updated
                    policies.
                  </p>
                </div>
              </div>

              {/* Section 11: Contact Information */}
              <div className="border-t border-gray-200 pt-8">
                <SectionHeader id="contact" title="11. Contact Information" />
                <div className="space-y-3 text-gray-700">
                  <p>
                    Questions, concerns, or complaints related to the
                    collection, use, processing, or disclosure of your personal
                    data may be addressed through our grievance redressal
                    mechanism.
                  </p>
                  <p>
                    Propenu has appointed a Grievance Officer to handle
                    privacy-related concerns, complaints, or data protection
                    issues in a timely manner.
                  </p>
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded space-y-2">
                    <p className="font-semibold">You may contact us at:</p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:support@propenu.com"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        support@propenu.com
                      </a>
                    </p>
                    <p className="text-sm text-gray-600 pt-2">
                      We will make reasonable efforts to respond to and resolve
                      grievances within a reasonable timeframe, in accordance
                      with applicable laws.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="border-t border-gray-200 mt-8 pt-8">
                <div className="bg-gray-200 text-black rounded-lg p-6 text-center">
                  <p>Thank you for trusting Propenu with your information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
