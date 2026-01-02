// services/property.service.ts

import { ApiResponse, RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse } from "@/types/property";
import { SearchFilterParams } from "@/types/sharedTypes";
import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";


const url = process.env.NEXT_PUBLIC_API_URL


export const searchFilter = async (params: SearchFilterParams) => {
const res = await axiosInstance.get<ApiResponse>(`${url}/api/properties/search`, { params, });
return res.data;
};





export const requestOtp = async(payload:RequestOtpPayload) => {
  const res = await axiosInstance.post<RequestOtpPayload>(`${url}/api/users/auth/request-otp`, payload)
  return  res.data
  }

  export const verifyOtp = async (payload: VerifyOtpPayload) => {
  const res = await axiosInstance.post<VerifyOtpResponse>(
    `${url}/api/users/auth/verify-otp`,
    payload
  );

  return res.data; // this is now VerifyOtpResponse
};

export const me = async() => {

   const token = Cookies.get("token");
   if (!token) return null;

    const res = await axiosInstance.get(`${url}/api/users/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export const getShortlistedProperties = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/users/shortlist`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const postShortlistProperty = async (payload: { propertyId: string; propertyType: string }) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.post(`${url}/api/users/shortlist`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getMyProperties = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/properties/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};



export const getPlans = async ({userType, category}: { userType: "buyer" | "owner" | "agent" | "builder"; category?: "rent" | "sell" | "both";
}) => {
  const res = await axiosInstance.get(
    `${url}/api/payments/plans`,
    {
      params: {
        userType,
        category,
      },
    }
  );

  return res.data;
};


