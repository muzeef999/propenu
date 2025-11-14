export default function formatINR(price: number | string | undefined) {
  if (!price) return "";
  const n = Number(price);
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 100000) return `₹  ${(n / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
