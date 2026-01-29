"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/data/ClientData";
import { getMyAgentProfile } from "./data";
import Sidebar from "./Sidebar";
import AgentRegistrationModal from "./components/AgentRegistrationModal";
import { useModal } from "@/app/context/ModalContext";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const { setIsAgentRegistrationModalOpen } = useModal();

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);
        
        // Check if user is an agent
        const roleName = data?.user?.roleName || data?.user?.role;
        if (roleName === "agent") {
          // Fetch agent profile status
          const agentProfile = await getMyAgentProfile();
          if (agentProfile?.exists === false) {
            setShowAgentModal(true);
            setIsAgentRegistrationModalOpen(true);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchUser();
  }, [setIsAgentRegistrationModalOpen]);



  return (
    <div className="min-h-screen container mx-auto flex mb-2">
      <Sidebar />

      <main className="flex-1 p-6">
        {children}
        {/* Agent registration modal — blocks access until completed */}
        {showAgentModal && (
          <AgentRegistrationModal
            userId={user?.user?.id}
            open={true}
            onCompleted={() => {
              setShowAgentModal(false);
              setIsAgentRegistrationModalOpen(false);
              // refresh to pick up new profile
              window.location.reload();
            }}
          />
        )}
      </main>
    </div>
  );
}
