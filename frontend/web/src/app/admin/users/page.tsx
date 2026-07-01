"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminUserProfilePayload,
  getAllUsers,
  requestAdminUserPhoneChangeOtp,
  searchUsers,
  updateUserProfileById,
} from "@/data/ClientData";
import { toast } from "sonner";
import { FiEdit2, FiSearch, FiX } from "react-icons/fi";

type AdminUser = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountStatus?: string;
  role?: string;
  roleName?: string;
};

type AdminUserProfileForm = Required<Omit<AdminUserProfilePayload, "phoneOtp">>;

const emptyForm: AdminUserProfileForm = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
};

const roleFilters = [
  { label: "All roles", value: "" },
  { label: "Users", value: "user" },
  { label: "Agents", value: "agent" },
  { label: "Builders", value: "builder" },
  { label: "Admins", value: "admin" },
  { label: "Super admins", value: "super_admin" },
];

const getUserId = (user: AdminUser) => user.userId || user.id || user._id || "";

const toForm = (user?: AdminUser): AdminUserProfileForm => ({
  name: user?.name || "",
  companyName: user?.companyName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  address: user?.address || "",
  locality: user?.locality || "",
  city: user?.city || "",
  state: user?.state || "",
  pincode: user?.pincode || "",
});

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [pendingPhone, setPendingPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users", query.trim(), role],
    queryFn: async () => {
      if (query.trim() || role) {
        const data = await searchUsers({
          q: query.trim() || undefined,
          role: role || undefined,
        });
        return data.results || [];
      }

      return getAllUsers();
    },
  });

  const users = useMemo<AdminUser[]>(
    () => (Array.isArray(usersQuery.data) ? usersQuery.data : []),
    [usersQuery.data],
  );

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: AdminUserProfilePayload;
    }) => updateUserProfileById(userId, payload),
    onSuccess: () => {
      toast.success("User profile updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update user profile",
      );
    },
  });

  const requestPhoneOtpMutation = useMutation({
    mutationFn: ({ userId, phone }: { userId: string; phone: string }) =>
      requestAdminUserPhoneChangeOtp(userId, { phone }),
    onSuccess: (_data, variables) => {
      setPendingPhone(variables.phone);
      setPhoneOtp("");
      toast.success("OTP sent to new phone number");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    },
  });

  const startEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData(toForm(user));
    setPendingPhone("");
    setPhoneOtp("");
  };

  const updateField = (key: keyof AdminUserProfilePayload, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (!editingUser) return;

    const userId = getUserId(editingUser);
    if (!userId) {
      toast.error("User id not found");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const phoneChanged =
      formData.phone.trim() !== (editingUser.phone || "").trim();

    if (phoneChanged) {
      if (!formData.phone.trim()) {
        toast.error("Phone number is required");
        return;
      }

      if (pendingPhone !== formData.phone.trim()) {
        requestPhoneOtpMutation.mutate({
          userId,
          phone: formData.phone.trim(),
        });
        return;
      }

      if (!phoneOtp.trim()) {
        toast.error("Enter OTP to update phone number");
        return;
      }
    }

    const payload: AdminUserProfilePayload = {
      ...formData,
      phoneOtp: phoneChanged ? phoneOtp.trim() : undefined,
    };

    if (!phoneChanged) {
      delete payload.phone;
    }

    updateMutation.mutate({
      userId,
      payload,
    });
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-green-700">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold">User Profiles</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users"
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:w-72"
              />
            </label>

            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {roleFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersQuery.isLoading && (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={7}>
                      Loading users...
                    </td>
                  </tr>
                )}

                {usersQuery.isError && (
                  <tr>
                    <td className="px-4 py-10 text-center text-red-600" colSpan={7}>
                      Failed to load users.
                    </td>
                  </tr>
                )}

                {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={7}>
                      No users found.
                    </td>
                  </tr>
                )}

                {users.map((user) => {
                  const location = [user.locality, user.city, user.state]
                    .filter(Boolean)
                    .join(", ");
                  const displayRole = user.roleName || user.role || "Not set";

                  return (
                    <tr key={getUserId(user)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-950">
                          {user.name || "Not set"}
                        </div>
                        {user.companyName && (
                          <div className="text-xs text-gray-500">
                            {user.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-700">
                        {displayRole.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {user.email || "Not set"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {user.phone || "Not set"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {location || user.pincode || "Not set"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                          {user.accountStatus || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-green-600 px-3 text-sm font-semibold text-green-700 hover:bg-green-50"
                        >
                          <FiEdit2 className="h-4 w-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Edit Profile</h2>
                <p className="text-sm text-gray-500">
                  {editingUser.roleName || editingUser.role || "User"} account
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setPendingPhone("");
                  setPhoneOtp("");
                }}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <EditField label="Name" value={formData.name} onChange={(value) => updateField("name", value)} />
              <EditField label="Company Name" value={formData.companyName} onChange={(value) => updateField("companyName", value)} />
              <EditField label="Email" value={formData.email} onChange={(value) => updateField("email", value)} />
              <EditField
                label="Phone"
                value={formData.phone}
                onChange={(value) => {
                  updateField("phone", value);
                  if (value.trim() !== pendingPhone) {
                    setPendingPhone("");
                    setPhoneOtp("");
                  }
                }}
              />
              {formData.phone.trim() !== (editingUser.phone || "").trim() && (
                <label className="block">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    Phone OTP
                  </span>
                  <input
                    value={phoneOtp}
                    onChange={(event) => setPhoneOtp(event.target.value)}
                    placeholder={
                      pendingPhone === formData.phone.trim()
                        ? "Enter OTP"
                        : "Send OTP first"
                    }
                    disabled={pendingPhone !== formData.phone.trim()}
                    className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                  />
                </label>
              )}
              <EditField label="Locality" value={formData.locality} onChange={(value) => updateField("locality", value)} />
              <EditField label="City" value={formData.city} onChange={(value) => updateField("city", value)} />
              <EditField label="State" value={formData.state} onChange={(value) => updateField("state", value)} />
              <EditField label="Pincode" value={formData.pincode} onChange={(value) => updateField("pincode", value)} />
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase text-gray-500">
                  Address
                </span>
                <textarea
                  value={formData.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setPendingPhone("");
                  setPhoneOtp("");
                }}
                className="h-10 rounded-md px-4 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || requestPhoneOtpMutation.isPending}
                className="h-10 rounded-md bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {requestPhoneOtpMutation.isPending
                  ? "Sending OTP..."
                  : updateMutation.isPending
                    ? "Saving..."
                    : formData.phone.trim() !== (editingUser.phone || "").trim() &&
                        pendingPhone !== formData.phone.trim()
                      ? "Send OTP"
                      : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function EditField({
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
