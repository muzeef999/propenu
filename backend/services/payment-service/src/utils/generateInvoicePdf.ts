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

    /* =========================
       HEADER
    ========================= */

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PROPENU – INVOICE", { align: "center" });

    doc.moveDown(1);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice No: ${data.invoiceNo}`)
      .text(`Date: ${data.date}`);

    doc.moveDown(1.5);
  /* =========================
       BILL FROM / BILL TO
    ========================= */

    const startY = doc.y;

    // BILL FROM
    doc.font("Helvetica-Bold").text("BILL FROM", 50, startY,);
    doc.fontSize(18).lineGap(2).text("Propenu Solutions Private Limited");
    doc.font("Helvetica").moveDown(0.5).lineGap(1);
    doc.text("#191, 5th Floor, Tagore Towers,");
    doc.text("Kavuri Hills Phase 2, Hyderabad – 500033");
    doc.text("Phone: +91 9000352299");
    doc.text("Email: contact@propenu.com");
    doc.text("Website: www.propenu.com");
    doc.text("GSTIN: 07AA228P1ZR");
    doc.text("PAN: AAIC228P");
    doc.text("CIN: U7010C256668");

    // BILL TO
    doc.font("Helvetica-Bold").text("BILL TO", 50, 423);
    doc.font("Helvetica").moveDown(0.5);
    doc.text(data.userName, 450);

    doc.moveDown(2);



    /* =========================
       GST & TOTAL
    ========================= */

    const cgst = data.amount * 0.09;
    const sgst = data.amount * 0.09;
    const total = data.amount + cgst + sgst;

    doc.text(`CGST (9%): ₹${cgst.toFixed(2)}`, { align: "right" });
    doc.text(`SGST (9%): ₹${sgst.toFixed(2)}`, { align: "right" });

    doc
      .font("Helvetica-Bold")
      .text(`Total (Inclusive of GST): ₹${total.toFixed(2)}`, {
        align: "right",
      });

    doc.moveDown(2);

    /* =========================
       FOOTER
    ========================= */

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Congratulations, & thank you for trusting Propenu.com. Your subscription is active, and your journey to property connections begins now.",
        { align: "center" }
      );

    doc.moveDown(2);

    doc.text("Propenu Authorized", { align: "right" });

    doc.end();
  });
}
