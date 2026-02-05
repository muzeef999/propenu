// services/property.service.ts

import { IFeaturedProject } from "@/app/(pages)/builder/create-property/types";
import {
  ApiResponse,
  createRequestOtpPayload,
  createVerifyOtpPayload,
  RequestOtpPayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/property";
import { SearchFilterParams } from "@/types/sharedTypes";
import axiosInstance from "@/utilies/axiosInstance";
import Cookies from "js-cookie";

const url = process.env.NEXT_PUBLIC_API_URL;

export async function getFeaturedProjects(params?: {
  state?: string;
  city?: string;
}) {
  const query = new URLSearchParams();

  if (params?.state) query.append("state", params.state);
  if (params?.city) query.append("city", params.city);

  const res = await fetch(
    `${url}/api/properties/featured-project/city?${query.toString()}`,
    { cache: "no-store" }, // for dynamic search
  );

  if (!res.ok) {
    throw new Error("Failed to fetch featured projects");
  }

  return res.json();
}

//highlight projects
export async function getHighlightProjects(params?: {
  state?: string;
  city?: string;
}) {
  const query = new URLSearchParams();

  if (params?.city) query.append("city", params.city);

  const res = await fetch(
    `${url}/api/properties/highlight-projects/city?${query.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch highlight projects");
  }
  return res.json();
}

// export async function getAllAgentConnect(){
//   const res = await fetch(`${url}/api/users/agent`, {next : { revalidate: 10}});
//   if(!res.ok) {
//       throw new Error('Failed to fetch Agent Connect data');
//   }
//   return res.json();

// }
export async function getOwnerProperties(params?: {
  state?: string;
  city?: string;
}) {
  const query = new URLSearchParams();

  if (params?.state) query.append("state", params.state);
  if (params?.city) query.append("city", params.city);

  const res = await fetch(
    `${url}/api/properties/owners-properties?${query.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch popular Owner Properties");
  }
  return res.json();
}

export async function getAgentConnect(params?: { city?: string }) {
  const query = new URLSearchParams();

  if (params?.city) query.append("city", params.city);

  const res = await fetch(`${url}/api/users/agent/city?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Agent Connect data");
  }
  return res.json();
}

export const searchFilter = async (params: SearchFilterParams) => {
  const res = await axiosInstance.get<ApiResponse>(
    `${url}/api/properties/search`,
    { params },
  );
  return res.data;
};

export const requestOtp = async (payload: RequestOtpPayload) => {
  const res = await axiosInstance.post<RequestOtpPayload>(
    `${url}/api/users/auth/request-otp`,
    payload,
  );
  return res.data;
};

export const verifyOtp = async (payload: VerifyOtpPayload) => {
  const res = await axiosInstance.post<VerifyOtpResponse>(
    `${url}/api/users/auth/verify-otp`,
    payload,
  );

  return res.data; // this is now VerifyOtpResponse
};

export const createRequestOtp = async (payload: createRequestOtpPayload) => {
  const res = await axiosInstance.post<createRequestOtpPayload>(
    `${url}/api/users/auth/request-otp/create`,
    payload,
  );
  return res.data;
};

export const createVerifyOtp = async (
  payload: createVerifyOtpPayload,
): Promise<VerifyOtpResponse> => {
  const res = await axiosInstance.post<VerifyOtpResponse>(
    `${url}/api/users/auth/verify-otp/create`,
    payload,
  );

  return res.data;
};

export const me = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/users/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

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

  const res = await axiosInstance.get(`${url}/api/properties/search/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getPlans = async ({
  userType,
  category,
}: {
  userType: "buyer" | "owner" | "agent" | "builder";
  category?: "rent" | "sell" | "both" | "rent_view" | "buy";
}) => {
  const res = await axiosInstance.get(`${url}/api/payments/plans`, {
    params: {
      userType,
      category,
    },
  });

  return res.data;
};

export const postLeads = async (payload: {
  name: string;
  phone: string;
  email?: string;
  projectId?: string;
  listingType?: string;
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
};

export const getProjectLeads = async (projectId: string) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(
    `${url}/api/properties/leads?projectId=${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const getHighlightProjectBuilders = async () => {
  const res = await axiosInstance.get(
    `${url}/api/properties/highlight-projects/builder/me`,
    {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    },
  );
  return res.data;
};

export const getAgentProfile = async (agentId: string) => {
  const res = await axiosInstance.get(`${url}/api/users/agent/${agentId}`);

  return res.data;
};

export const updateAgentProfileByPhone = async (
  phone: string,
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
    avatar?: File;
    coverImage?: File;
  }>
) => {
  const hasFiles = payload.avatar || payload.coverImage;

  if (hasFiles) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if ((key === "avatar" || key === "coverImage") && value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, v));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const res = await axiosInstance.patch(
      `${url}/api/users/agent/by-phone/${phone}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  }

  const res = await axiosInstance.patch(
    `${url}/api/users/agent/by-phone/${phone}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
      },
    }
  );

  return res.data;
};


export const createFeaturedProperty = async (
  formData: FormData,
): Promise<IFeaturedProject> => {
  const token = Cookies.get("token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${url}/api/properties/featured-project`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create featured property");
  }

  return response.json();
};

export const getMyContactedProperties = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(
    `${url}/api/properties/leads/my-contacts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const getBuilderDashboards = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/users/builder/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

//membership history
export const getMembershipHistory = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/payments/subscriptions/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};