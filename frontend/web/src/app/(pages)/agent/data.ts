import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";

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

export const registerAgency = async (
  payload: {
    name: string;
    bio: string;
    agencyName: string;
    licenseNumber: string;
    licenseValidTill: string;
    city: string;
    locality?: string;
    experienceYears: number;
    dealsClosed: number;
    areasServed: string[];
    languages: string[];
    verificationStatus: "approved" | "pending" | "rejected";
    rera: {
      reraAgentId: string;
      isVerified: boolean;
    };
    stats: {
      totalProperties: number;
      publishedCount: number;
    };
    user: string;
  },
  files?: {
    avatar?: File;
    coverImage?: File;
  }
) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const formData = new FormData();

  // basic fields
  formData.append("name", payload.name);
  formData.append("bio", payload.bio);
  formData.append("agencyName", payload.agencyName);
  formData.append("licenseNumber", payload.licenseNumber);
  formData.append("licenseValidTill", payload.licenseValidTill);
  formData.append("city", payload.city);
  if (payload.locality) {
    formData.append("locality", payload.locality);
  }
  formData.append("experienceYears", String(payload.experienceYears));
  formData.append("dealsClosed", String(payload.dealsClosed));
  formData.append("verificationStatus", payload.verificationStatus);
  formData.append("user", payload.user);

  // arrays (IMPORTANT)
  // arrays (ALWAYS arrays now)
  payload.areasServed.forEach((area) => {
    formData.append("areasServed[]", area.trim());
  });

  payload.languages.forEach((lang) => {
    formData.append("languages[]", lang.trim());
  });


  // objects (IMPORTANT)
  formData.append("rera[reraAgentId]", payload.rera.reraAgentId);
  formData.append("rera[isVerified]", String(payload.rera.isVerified));

  formData.append(
    "stats[totalProperties]",
    String(payload.stats.totalProperties)
  );
  formData.append(
    "stats[publishedCount]",
    String(payload.stats.publishedCount)
  );

  // files
  if (files?.avatar) {
    formData.append("avatar", files.avatar);
  }

  if (files?.coverImage) {
    formData.append("coverImage", files.coverImage);
  }

  const res = await axiosInstance.post(
    `${url}/api/users/agent`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

