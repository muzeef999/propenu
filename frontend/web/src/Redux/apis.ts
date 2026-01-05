const url = process.env.NEXT_PUBLIC_API_URL;
import Cookies from "js-cookie";


export const residentialApi = async (formData: FormData) => {
   const token = Cookies.get("token");

  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${url}/api/properties/residential`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Residential API failed");
  }

  return res.json();
};

export const commercialApi = async (formData: FormData) => {
   const token = Cookies.get("token");

  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${url}/api/properties/commercial`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  },);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Commercial API failed");
  }

  return res.json();
};

export const landApi = async (formData: FormData) => {
   const token = Cookies.get("token");

  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${url}/api/properties/land`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Land API failed");
  }

  return res.json();
};

export const agriculturalApi = async (formData: FormData) => {
   const token = Cookies.get("token");

  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${url}/api/properties/agricultural`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Agricultural API failed");
  }

  return res.json();
};
