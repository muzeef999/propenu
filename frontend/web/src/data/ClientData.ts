// services/property.service.ts

import { ApiResponse, RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse } from "@/types/property";
import { SearchFilterParams } from "@/types/sharedTypes";
import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";


const url = process.env.NEXT_PUBLIC_API_URL


export const searchFilter = async (params: SearchFilterParams) => {
console.log("🔍 searchFilter params →", params);
const res = await axiosInstance.get<ApiResponse>(`${url}/api/properties/search`, { params, });
console.log("response data", res.data);
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
