// services/property.service.ts

import { ApiResponse, createRequestOtpPayload, createVerifyOtpPayload, RequestOtpPayload, VerifyOtpPayload, VerifyOtpResponse } from "@/types/property";
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

export const createRequestOtp = async(payload:createRequestOtpPayload) => {
  const res = await axiosInstance.post<createRequestOtpPayload>(`${url}/api/users/auth/request-otp/create`, payload)
  return  res.data
  }

  export const createVerifyOtp = async (payload: createVerifyOtpPayload) => {
    const res = await axiosInstance.post<createVerifyOtpPayload>(
    `${url}/api/users/auth/verify-otp/create`,
    payload
  );
  return res.data;
}

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

export const postShortlistProperty = async (payload: {
  propertyId: string;
  propertyType: string;
}) => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axiosInstance.post(
    `${url}/api/users/shortlist`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};


export const getMyProperties = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/properties/search/my`, {
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

export const postLeads = async (payload: {
  name: string;
  phone: string;
  email?: string;
  projectId?: string;
  propertyType?: string;
  remarks?: string;
}) => {
  const cookies = Cookies.get("token");
  if (!cookies) return null;

  const res = await axiosInstance.post(`${url}/api/properties/leads`, payload, {
    headers: {
      Authorization: `Bearer ${cookies}`,
    },
  });
  return res.data;
  
}

export const getProjectLeads = async (projectId: string) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/properties/leads?projectId=${projectId}`, {
     headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getHighlightProjectBuilders = async () => {
  const res = await axiosInstance.get(`${url}/api/properties/highlight-projects/builder/me`, {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
  });
  return res.data;
} ;

export const getAgentProfile = async (agentId: string) => {
  const res = await axiosInstance.get(
    `${url}/api/users/agent/${agentId}`,
  );

  return res.data;
};

export const updateAgentProfile = async (
  agentId: string,
  payload: Partial<{
    name: string;
    bio: string;
    agencyName: string;
    city: string;
    areasServed: string[];
    languages: string[];
    experienceYears: number;
    licenseNumber: string;
    licenseValidTill: string;
  }>
) => {
  const res = await axiosInstance.patch(
    `${url}/api/users/agent/${agentId}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    }
  );

  return res.data;
};