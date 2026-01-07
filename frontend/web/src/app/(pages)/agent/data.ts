import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";
import { sl } from "zod/v4/locales";

const url = process.env.NEXT_PUBLIC_API_URL;

export const useMySubscription = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await axiosInstance.get(`${url}/api/payments/subscriptions/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getPlans = async (params: {
  userType: "buyer" | "owner" | "agent" | "builder";
}) => {
  const res = await axiosInstance.get(`${url}/api/payments/plans`, { params });
  return res.data;
};

export const createPaymentOrder = async (payload: {
  planId: string;
  userType: "buyer" | "builder" | "agent";
}) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.post(`${url}/api/payments/create`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.post(`${url}/api/payments/verify`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};


export const getMyAgentProfile = async (dateRange: string = "30") => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/users/agent/my`, {
    params: { range: dateRange },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const registerAgency = async (payload: {
  name: string;
  bio: string;
  agencyName: string;
  licenseNumber: string;
  licenseValidTill: string;
  city: string;
  experienceYears: number;
  dealsClosed: number;
  areasServed: string[];
  languages: string[];
  verificationStatus: "approved" | "pending" | "rejected";
  coverImage: string;
  avatar: string;
  rera: {
    reraAgentId: string;
    isVerified: boolean;
  };
  stats: {
    totalProperties: number;
    publishedCount: number;
  };
  user: string;
}) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.post(`${url}/api/users/agent`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

