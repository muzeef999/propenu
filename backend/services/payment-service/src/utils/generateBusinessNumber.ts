import { Payment } from "../models/paymentModel";

export async function generateBusinessNumber(prefix: "ORD" | "INV") {
  const now = new Date();

  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  const regex = new RegExp(`^${prefix}-${yearMonth}`);

  const lastRecord = await Payment.findOne({
    [`${prefix === "ORD" ? "orderNumber" : "invoiceNumber"}`]: regex,
  })
    .sort({ createdAt: -1 })
    .lean();

  let sequence = 1;

  if (lastRecord) {
    const value = prefix === "ORD" ? lastRecord.orderNumber : lastRecord.invoiceNumber;

    if (typeof value === "string") {

      const parts = value.split("-");
      const lastSequence = parseInt(parts[2] || "0");

      sequence = lastSequence + 1;
    }
  }

  return `${prefix}-${yearMonth}-${String(sequence).padStart(4, "0")}`;
}
