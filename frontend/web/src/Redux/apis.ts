import Cookies from "js-cookie";
const url = process.env.NEXT_PUBLIC_API_URL;

function authHeader() {
  const token = Cookies.get("token");
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

/* ---------------- DRAFT ---------------- */

export const createDraftApi = async (category: string) => {
  const res = await fetch(`${url}/api/properties/${category}/draft`, {
    method: "POST",
    headers: authHeader(),
  });

  if (!res.ok) throw await res.json();
  return res.json();
};

/* ---------------- BASIC ---------------- */

export const updateBasicApi = async (category: string, id: string, data: any) => {
  return stepPatch(category, id, "basic", data);
};

/* ---------------- LOCATION ---------------- */

export const updateLocationApi = async (category: string, id: string, data: any) => {
  return stepPatch(category, id, "location", data);
};

/* ---------------- DETAILS ---------------- */

export const updateDetailsApi = async (
  category: string,
  id: string,
  formData: FormData
) => {
  const res = await fetch(
    `${url}/api/properties/${category}/${id}/details`,
    {
      method: "PATCH",
      headers: authHeader(), // ❌ don't set content-type
      body: formData,
    }
  );

  if (!res.ok) throw await res.json();
  return res.json();
};

/* ---------------- VERIFICATION ---------------- */

export const finalizeApi = async (category: string, id: string, data: any) => {
  return stepPatch(category, id, "verification", data);
};

/* ---------------- helper ---------------- */

async function stepPatch(
  category: string,
  id: string,
  step: string,
  data: any
) {
  const res = await fetch(
    `${url}/api/properties/${category}/${id}/${step}`,
    {
      method: "PATCH",
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) throw await res.json();
  return res.json();
}
