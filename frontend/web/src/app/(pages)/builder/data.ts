import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";

const url = process.env.NEXT_PUBLIC_API_URL;

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
