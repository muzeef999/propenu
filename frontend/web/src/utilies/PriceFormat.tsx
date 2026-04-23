export default function formatINR(price: number | string | undefined) {
  if (price === undefined || price === null || price === "") return "";
  const n = Number(price);
  if (Number.isNaN(n)) return "";
  if (n >= 10000000) return `₹ ${Number((n / 10000000).toFixed(2))} Cr`;
  if (n >= 100000) return `₹ ${Number((n / 100000).toFixed(2))} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
