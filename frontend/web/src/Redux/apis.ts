const url = process.env.NEXT_PUBLIC_API_URL


export const residentialApi = async (formData: FormData) => {
  const res = await fetch(`${url}/api/properties/residential`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Residential API failed");
  }

  return res.json();
};


export const commercialApi = async (formData: FormData) => {
  const res = await fetch(`${url}/api/properties/commercial`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Commercial API failed");
  }

  return res.json();
};


export const landApi = async (formData: FormData) => {
  const res = await fetch(`${url}/api/properties/land`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Land API failed");
  }

  return res.json();
};



export const agriculturalApi = async (formData: FormData) => {
  const res = await fetch(`${url}/api/properties/agricultural`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Agricultural API failed");
  }

  return res.json();
};
