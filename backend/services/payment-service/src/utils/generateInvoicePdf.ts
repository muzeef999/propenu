import PDFDocument from "pdfkit";
import { Buffer } from "buffer";

export async function generateInvoicePdf(data: {
  invoiceNo: string;
  userName: string;
  planName: string;
  amount: number;
  date: string;
}): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(18).text("PROPENU – Subscription Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice No: ${data.invoiceNo}`);
    doc.text(`Date: ${data.date}`);
    doc.moveDown();

    doc.text(`Customer: ${data.userName}`);
    doc.text(`Plan: ${data.planName}`);
    doc.text(`Amount Paid: ₹${data.amount}`);
    doc.moveDown();

    doc.text("Thank you for subscribing!", { align: "center" });

    doc.end();
  });
}
