export const renderTemplate = (
  template: string,
  data: Record<string, string>
) => {
  let result = template;

  for (const key in data) {
    const value = data[key] ?? ""; // ✅ fallback

    result = result.replace(new RegExp(`{${key}}`, "g"), value);
  }

  return result;
};