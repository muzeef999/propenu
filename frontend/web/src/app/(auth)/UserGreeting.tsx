"use client";
import FilterDropdown from "@/ui/FilterDropdown";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HiChevronDown } from "react-icons/hi2";
import { useState } from "react";

interface UserGreetingProps {
  user?: {
    user?: {
      name?: string;
      roleName?: string;
    };
  };
}

const GreetingOptions = [
  { label: "My Properties", link: "/my-properties" },
  { label: "Shortlisted Properties", link: "/shortlisted-properties" },
  { label: "Contacted Properties", link: "/contacted-properties" },
  { label: "Manage Subscription", link: "/membership" },
  { label: "Account & Settings", link: "/settings" },

];

const AgentOptions = [
  { label: "Dashboard", link: "/agent" },
  { label: "My Properties", link: "/agent/my-properties" },
  { label: "Leads", link: "/agent/leads" },
  { label: "My Plans", link: "/agent/my-plan" },
  { label: "Account & Settings", link: "/agent/account-settings" },
];



const BuilderOptions = [
  { label: "Dashboard", link: "/builder" },
  { label: "My Properties", link: "/builder/my-properties" },
  { label: "Leads", link: "/builder/leads" },
  { label: "My Plans", link: "/builder/plans" },
  { label: "Account & Settings", link: "/builder/account-settings" },
];


const UserGreeting = ({ user }: UserGreetingProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const getOptionsForRole = (roleName?: string) => {
    switch (roleName) {
      case "agent":
        return AgentOptions;
      case "builder":
        return BuilderOptions;
      default:
        return GreetingOptions;
    }
  };
  const getInitial = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const role = user?.user?.roleName;
  const options = getOptionsForRole(role);
  const showRole = role && role !== "user";

 
  return (
    <div className="text-sm text-gray-700">
      <FilterDropdown
        triggerLabel={
          <div 
            className="flex items-center gap-3 cursor-pointer px-4 py-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* Avatar */}
            <div
              className={`h-9 w-9 rounded-full border border-[#27AE60] text-[#26ad5f] flex items-center justify-center font-semibold text-sm shadow`}
            >
              {getInitial(user?.user?.name)}
            </div>

            {/* Name & Role */}
            <div className="flex flex-col items-start">
              <span className="text-sm  text-gray-800 capitalize">
                Hi, {user?.user?.name || "User"}
              </span>
              {showRole && (
                <span className="text-xs text-gray-500 capitalize">{role}</span>
              )}
            </div>

            {/* Dropdown Icon */}
            <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
              <HiChevronDown className="w-4 h-4" />
            </div>
          </div>
        }
        width="w-56"
        align="left"
        showDoneButton={false}
        renderContent={(close) => (
          <div className="py-2">
            {options.map((item) => {
              const handleClick = () => {

                if (item.link) {
                  router.push(item.link);
                  close();
                }
                setIsOpen(false);
              };

              return (
                <div key={item.label}>

                  <button
                    type="button"
                    onClick={handleClick}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition cursor-pointer hover:bg-gray-100 focus:bg-gray-100`}
                  >
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      />
    </div>
  );
};

export default UserGreeting;
