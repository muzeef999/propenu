import { randomInt } from "crypto";

export type PropertyCodeCategory = "RES" | "COM" | "LAN" | "AGR";

function randomNumericCode(length = 8) {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(randomInt(min, max));
}

export async function generatePropertyCode(_params: {
  city: string | undefined;
  locality: string | undefined;
  category: PropertyCodeCategory;
}) {
  return randomNumericCode();
}
