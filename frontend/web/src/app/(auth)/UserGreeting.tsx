"use client";
import FilterDropdown from "@/ui/FilterDropdown";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserGreetingProps {
  user?: {
    user?: {
      name?: string;
    };
  };
}

const GreetingOptions = [
  { label: "My Profile", link: "/profile" },
  { label: "My Properties", link: "/my-properties" },
  { label: "Shortlisted Properties", link: "/shortlisted" },
  { label: "Contacted Properties", link: "/contacted" },
  { label: "Manage Subscription", link: "/subscription" },
  { label: "Logout", action: "logout" },
];

const UserGreeting = ({ user }: UserGreetingProps) => {
  const router = useRouter();

  return (
    <div className="text-sm text-gray-700">
      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer">
            Hi, {user?.user?.name}
          </span>
        }
        width="w-56"
        align="left"
        openOnHover={true}
        renderContent={(close) => (
          <div className="py-2">
            {GreetingOptions.map((item) => {
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
                  close?.();
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
