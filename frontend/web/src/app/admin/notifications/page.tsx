"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AdminNotificationAudience,
  getAdminNotifications,
  sendAdminNotification,
} from "@/data/ClientData";
import { toast } from "sonner";
import { FiBell, FiImage, FiMapPin, FiSend, FiUsers, FiX } from "react-icons/fi";

const audienceOptions: Array<{
  value: AdminNotificationAudience;
  label: string;
}> = [
  { value: "all", label: "All users" },
  { value: "builder", label: "Builders" },
  { value: "agent", label: "Agents" },
  { value: "owner", label: "Owners" },
  { value: "user", label: "Users" },
];

const emptyForm = {
  title: "",
  body: "",
  audience: "all" as AdminNotificationAudience,
  state: "",
  city: "",
  locality: "",
};

export default function AdminNotificationsPage() {
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications-feed"],
    queryFn: getAdminNotifications,
  });

  const recentNotifications = useMemo(
    () => notificationsQuery.data?.data ?? [],
    [notificationsQuery.data],
  );

  const sendMutation = useMutation({
    mutationFn: () =>
      sendAdminNotification({
        ...form,
        image,
      }),
    onSuccess: (data) => {
      toast.success(
        `Notification sent to ${data.successCount || 0} users`,
      );
      setForm(emptyForm);
      setImage(null);
      notificationsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to send notification",
      );
    },
  });

  const canSend = form.title.trim().length > 0 && form.body.trim().length > 0;

  return (
    <main className="min-h-screen bg-[#F7FAF8] px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase text-green-700">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Send Notification</h1>
          </div>

          <div className="grid gap-5 p-5">
            <div>
              <span className="text-xs font-semibold uppercase text-gray-500">
                Audience
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                {audienceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        audience: option.value,
                      }))
                    }
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${
                      form.audience === option.value
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FiUsers className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Title"
                value={form.title}
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
              />
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">
                  Image
                </span>
                <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm">
                  <FiImage className="h-4 w-4 text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setImage(event.target.files?.[0] ?? null)
                    }
                    className="min-w-0 flex-1 text-sm"
                  />
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100"
                      aria-label="Remove image"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase text-gray-500">
                Message
              </span>
              <textarea
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                rows={5}
                placeholder="Festival wishes, campaign announcement, offer, or update"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                <FiMapPin className="h-4 w-4" />
                Optional Location Filter
              </div>
              <div className="mt-2 grid gap-4 sm:grid-cols-3">
                <TextField
                  label="State"
                  value={form.state}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, state: value }))
                  }
                />
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, city: value }))
                  }
                />
                <TextField
                  label="Locality"
                  value={form.locality}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, locality: value }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                disabled={!canSend || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                <FiSend className="h-4 w-4" />
                {sendMutation.isPending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase text-green-700">
                Feed
              </p>
              <h2 className="mt-1 text-lg font-semibold">Recent Admin Alerts</h2>
            </div>
            <FiBell className="h-5 w-5 text-green-700" />
          </div>

          <div className="max-h-[640px] overflow-y-auto p-4">
            {notificationsQuery.isLoading && (
              <p className="py-8 text-center text-sm text-gray-500">
                Loading notifications...
              </p>
            )}

            {!notificationsQuery.isLoading && recentNotifications.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                No admin notifications yet.
              </p>
            )}

            <div className="space-y-3">
              {recentNotifications.map((item: any) => (
                <article
                  key={String(item._id)}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                    </div>
                    <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
                      {item.type || "alert"}
                    </span>
                  </div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="mt-3 h-28 w-full rounded-md object-cover"
                    />
                  )}
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-gray-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}
