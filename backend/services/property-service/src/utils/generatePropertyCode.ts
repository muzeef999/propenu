import Counter from "../models/counterModel";

export type PropertyCodeCategory = "RES" | "COM" | "LAN" | "AGR";

function toCodePart(value?: string, length = 3) {
  const normalized = value?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ?? "";

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, length).padEnd(length, "X");
}

function toLocalityCode(value?: string) {
  const normalized = value?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ?? "";

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, 3).padEnd(3, "X");
}

export async function generatePropertyCode({
  city,
  locality,
  category,
}: {
  city: string | undefined;
  locality: string | undefined;
  category: PropertyCodeCategory;
}) {
  const cityCode = toCodePart(city);
  const localityCode = toLocalityCode(locality);

  if (!cityCode || !localityCode) {
    return undefined;
  }

  const counterKey = `PROPERTY_${cityCode}_${localityCode}_${category}`;
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return `PENU-${cityCode}-${localityCode}-${category}-${String(counter.seq).padStart(4, "0")}`;
}
