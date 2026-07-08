export function formatLabel(value: unknown) {
  if (value == null) {
    return "";
  }

  const normalizedValue = Array.isArray(value)
    ? value.join(", ")
    : String(value);

  return normalizedValue
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word) && word.length <= 5) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
