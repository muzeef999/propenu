// services/property.service.ts

import { ApiResponse, RequestOtpPayload, VerifyOtpPayload } from "@/types/property";
import axiosInstance from "@/utilies/axiosInstance";

const url = process.env.NEXT_PUBLIC_API_URL


export const searchFilter = async ({propertyType, listingType,  searchText,}: {  propertyType?: string;  listingType?: string; searchText?: string;}) => {
  const res = await axiosInstance.get<ApiResponse>(`${url}/properties/search`, {
    params: {
      propertyType,
      listingType,
      search: searchText,
    },
  });

  return res.data;
};


export const requestOtp = async(payload:RequestOtpPayload) => {
  const res = await axiosInstance.post<RequestOtpPayload>(`${url}/api/users/auth/request-otp`, payload)
  return  res.data
  }

export const verifyOtp = async(payload:VerifyOtpPayload) => { 
  const res = await axiosInstance.post<VerifyOtpPayload>(`${url}/api/users/auth/verify-otp`, payload)
  return res.data
}