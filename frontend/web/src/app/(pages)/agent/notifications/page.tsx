"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import NotificationFeed from "@/components/notifications/NotificationFeed";
import { getAgentNotifications, markAgentNotificationsSeen } from "@/data/ClientData";

const Page = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agent-notifications-feed-v1"],
    queryFn: getAgentNotifications,
  });

  useEffect(() => {
    if (isLoading || isError || !data || (data.summary?.unread ?? 0) <= 0) return;

    void markAgentNotificationsSeen().then(() => {
      queryClient.invalidateQueries({ queryKey: ["agent-notifications-feed-v1"] });
      queryClient.invalidateQueries({ queryKey: ["agent-notifications-badge"] });
    });
  }, [data, isError, isLoading, queryClient]);

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
