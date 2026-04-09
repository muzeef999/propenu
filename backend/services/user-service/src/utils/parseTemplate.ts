// src/core/utils/parseTemplate.ts

/**
 * 🔥 Replace template variables with actual data
 * Example:
 * "Hello {{name}}" + { name: "Muzeef" }
 * → "Hello Muzeef"
 */
export const parseTemplate = (
  template: string,
  data: Record<string, any>
): string => {
  if (!template) return "";

  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = data[key.trim()];

    return value !== undefined && value !== null
      ? String(value)
      : "";
  });
};