"use client";
import FilterDropdown from "@/ui/FilterDropdown";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  { label: "Logout", action: "logout" },
];

const AgentOptions = [
  { label: "Dashboard", link: "/agent" },
  { label: "My Plans", link: "/agent/plans" },
  { label: "My Property", link: "/agent/my-Properties" },
  { label: "Account & Settings", link: "/agent/account-settings" },
  { label: "Leads", link: "/agent/leads" },
  { label: "Logout", action: "logout" },
];

const BuilderOptions = [
  { label: "Dashboard", link: "/builder/dashboard" },
  { label: "My Plans", link: "/builder/plans" },
  { label: "Leads", link: "/builder/leads" },
  { label: "My Property", link: "/builder/my-Properties" },
  { label: "Account & Settings", link: "/builder/account-settings" },
  { label: "Logout", action: "logout" },
];

const UserGreeting = ({ user }: UserGreetingProps) => {
  const router = useRouter();

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

  const options = getOptionsForRole(user?.user?.roleName);
 
  return (
    <div className="text-sm text-gray-700">
      <FilterDropdown
        triggerLabel={
          <>
            <span className="px-4 text-primary font-medium cursor-pointer items-end flex">
              Hi, {user?.user?.name}
              <br />
            </span>
            <span className="text-xs text-gray-500 items-end flex px-4 capitalize">
              {user?.user?.roleName || "user"}
            </span>
          </>
        }
        width="w-56"
        align="left"
        showDoneButton={false}
        renderContent={(close) => (
          <div className="py-2">
            {options.map((item) => {
              const isLogout = item.action === "logout";
              const handleClick = () => {
                if (isLogout) {
                  // remove token and refresh page
                  Cookies.remove("token");
                  toast.success("Logout successful!");
                  window.location.reload();
                  return;
                }

                if (item.link) {
                  router.push(item.link);
                  close();
                }
              };

              return (
                <div key={item.label}>
                  {isLogout && (
                    <div className="my-2 border-t border-gray-100" />
                  )}

                  <button
                    type="button"
                    onClick={handleClick}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                      isLogout
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
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
