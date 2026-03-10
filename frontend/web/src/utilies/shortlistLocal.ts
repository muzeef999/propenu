const STORAGE_KEY = "shortlist";

export const getLocalShortlist = () => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
};

export const addLocalShortlist = (propertyId: string, propertyType: string) => {
  const list = getLocalShortlist();

  const exists = list.some((p: any) => p.propertyId === propertyId);

  if (!exists) {
    list.push({ propertyId, propertyType });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
};

export const removeLocalShortlist = (propertyId: string) => {
  const list = getLocalShortlist().filter(
    (p: any) => p.propertyId !== propertyId
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const isLocalShortlisted = (propertyId: string) => {
  const list = getLocalShortlist();
  return list.some((p: any) => p.propertyId === propertyId);
};