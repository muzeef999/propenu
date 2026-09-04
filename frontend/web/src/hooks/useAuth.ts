"use client";

import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { me } from "@/data/ClientData";

export type Role = "user" | "builder" | "agent";
export type ViewerRole =
  | Role
  | "builder_staff"
  | "customer_care"
  | "relationship_manager";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ViewerRole;
}

export function useAuth() {
  const token = Cookies.get("token");

  const { data, isLoading } = useQuery({
    queryKey: ["auth-user", token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const response = await me();
        return response;
      } catch (err) {
        return null;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const userData = data?.user;
  const user: AuthUser | null = userData
    ? {
        id: userData.id || userData._id || "guest-user",
        name: userData.name || "Propenu User",
        email: userData.email || "",
        role: (userData.roleName || userData.role || "user") as ViewerRole,
      }
    : null;

  return {
    user,
    role: user?.role || null,
    isLoading: isLoading && !!token,
  };
}
