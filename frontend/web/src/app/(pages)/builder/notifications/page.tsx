"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import NotificationFeed from "@/components/notifications/NotificationFeed";
import { getBuilderNotifications, markBuilderNotificationsSeen } from "@/data/ClientData";

const Page = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["builder-notifications-feed-v2"],
    queryFn: getBuilderNotifications,
  });

  useEffect(() => {
    if (isLoading || isError || !data || (data.summary?.unread ?? 0) <= 0) return;

    void markBuilderNotificationsSeen().then(() => {
      queryClient.invalidateQueries({ queryKey: ["builder-notifications-feed-v2"] });
      queryClient.invalidateQueries({ queryKey: ["builder-notifications-badge"] });
    });
  }, [data, isError, isLoading, queryClient]);

  return (
    <NotificationFeed
      title="Notifications"
      description="Recent user activity across your projects, shown as one backend-driven notification feed."
      notifications={data?.data ?? []}
      summary={data?.summary}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  );
};

export default Page;
