"use client";

import { useQuery } from "@tanstack/react-query";

import NotificationFeed from "@/components/notifications/NotificationFeed";
import { getAgentNotifications } from "@/data/ClientData";

const Page = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agent-notifications-feed-v1"],
    queryFn: getAgentNotifications,
  });

  return (
    <NotificationFeed
      title="Notifications"
      description="Recent shortlist activity on your agent-owned properties appears here."
      notifications={data?.data ?? []}
      summary={data?.summary}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  );
};

export default Page;
