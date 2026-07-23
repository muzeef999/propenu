"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import NotificationFeed from "@/components/notifications/NotificationFeed";
import { getUserNotifications, markUserNotificationsSeen } from "@/data/ClientData";

const Page = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-notifications-feed-v1"],
    queryFn: getUserNotifications,
  });

  useEffect(() => {
    if (isLoading || isError || !data || (data.summary?.unread ?? 0) <= 0) return;

    void markUserNotificationsSeen().then(() => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications-feed-v1"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications-badge"] });
    });
  }, [data, isError, isLoading, queryClient]);

  return (
    <NotificationFeed
      title="Notifications"
      description="Your shortlist, brochure, and project activity history appears here."
      containerClassName="w-full max-w-none"
      notifications={data?.data ?? []}
      summary={data?.summary}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  );
};

export default Page;
