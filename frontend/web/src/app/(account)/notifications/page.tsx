"use client";

import { useQuery } from "@tanstack/react-query";

import NotificationFeed from "@/components/notifications/NotificationFeed";
import { getUserNotifications } from "@/data/ClientData";

const Page = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-notifications-feed-v1"],
    queryFn: getUserNotifications,
  });

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
