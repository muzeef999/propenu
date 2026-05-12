// services/property.service.ts

import { IFeaturedProject } from "@/app/(pages)/builder/create-property/types";
import { ProjectLeadPayload } from "@/app/(pages)/prime/[slug]/Herosection";
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
import axios from "axios";
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
`${url}/api/properties/featured-project?type=prime&${query.toString()}`,
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
  locality?: string;
}) {
  const query = new URLSearchParams();

  query.append("type", "featured");
  if (params?.state) query.append("state", params.state);
  if (params?.city) query.append("city", params.city);
  if (params?.locality) query.append("locality", params.locality);

  const res = await fetch(
    `${url}/api/properties/featured-project?${query.toString()}`,
    { cache: "no-store" }
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

export const getSponsored = async (params: SearchFilterParams) => {
  const res = await axiosInstance.get(
    `${url}/api/sponsored`,   // 🔥 your new API
    { params }
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

export const updateUser = async (payload: {
  name?: string;
  email?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.patch(`${url}/api/users/auth/me/update`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const deleteMyAccount = async (payload: {
  reason?: string;
  feedback?: string;
}) => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axiosInstance.delete(`${url}/api/users/auth/me`, {
    data: payload,
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

export const getUserShortlist = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axiosInstance.get(`${url}/api/users/shortlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getShortlistStatus = async (propertyId: string) => {
  const token = Cookies.get("token");
  const res = await axiosInstance.get(`${url}/api/users/shortlist/status`, {
    params: { propertyId }, // This sends ?propertyId=...
    headers: { Authorization: `Bearer ${token}` },
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
export const removeShortlistProperty = async (propertyId: string) => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axiosInstance.delete(
    `${url}/api/users/shortlist/${propertyId}`,
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


export const projectpostLeads = async (
  payload: ProjectLeadPayload
) => {
  const res = await axiosInstance.post(
    `${url}/api/properties/leads/project/lead`,
    payload
  );

  return res.data;
};

// export const projectpostLeads = async (payload: {
//   name: string;
//   phone: string;
//   email?: string;
//   projectId?: string;
//   remarks?: string;
// }) => {
//   const res = await axiosInstance.post(`${url}/api/properties/leads/project/lead`, payload);
//   return res.data;
// }; 

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


export const getProjectbuilderLeads = async (projectId: string, from?: Date, to?: Date) => {
  const params = new URLSearchParams();
  if (from) params.append("from", from.toISOString());
  if (to) params.append("to", to.toISOString());

  const res = await axiosInstance.get(
    `${url}/api/properties/leads/project/${projectId}/leads`,
    { params }
  );
  return res.data;
};

export const downloadLeadsCSV = async (
  projectId: string,
  from?: string,
  to?: string
) => {
  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const downloadUrl = `${url}/api/properties/leads/project/${projectId}/leads/csv?${params.toString()}`;

  window.open(downloadUrl, "_blank");
};


export const updateLeadStatus = async (id: string, status: string) => {
 const res  = await axiosInstance.patch(
    `${url}/api/properties/leads/project/${id}/status`,
    { status },
  );
  return res.data;
}


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

export const getMyAgentProfile = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/users/agent/me/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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

export const getBuilderFeaturedShortlists = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");

  const res = await axiosInstance.get(
    `${url}/api/users/builder/featured-shortlists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.data;
};



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

export const deactivateMyProperty = async (propertyId: string, propertyType: string) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.post(
    `${url}/api/properties/${propertyType}/${propertyId}/deactive`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const getFeaturedProjectsDashboard = async () => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.get(`${url}/api/properties/highlight-projects/builder/featured/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
  }


  export const  startKyc = async () => {
    const token = Cookies.get("token");
    if(!token) return null;

    const res = await axiosInstance.get(`${url}/api/users/kyc/start`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  }

export const updateKycDetails = async (payload: {
  name?: string;
  email?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) => {
  const token = Cookies.get("token");
  if (!token) return null;

  const res = await axiosInstance.patch(`${url}/api/users/kyc/details`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

  

  export const syncShortlist = async (properties: any[]) => {

  const token = Cookies.get("token");

  if (!token) return null;

  const res = await axiosInstance.post(
    `${url}/api/users/shortlist/sync`,   
    {
      properties,                 
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
};


export const updateLocation = async (payload:any) => {

  const token = Cookies.get("token");

  const res = await axios.post(
    `${url}/api/users/auth/update-location/create`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};




export const sendTokenToBackend = async (userId: string, token: string) => {
  await axios.post(`${url}/api/users/notifications/save-fcm-token`, {
    userId,
    token,
  });
};
