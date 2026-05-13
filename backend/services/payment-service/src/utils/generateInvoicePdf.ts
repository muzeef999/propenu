import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import path from "path";

export async function generateInvoicePdf(data: {
  invoiceNo: string;
  orderNo: string;
  userName: string;
  userPhone?: string | undefined;
  planName: string;
  amount: number;
  date: string;
}): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    const logoPath = path.join(process.cwd(), "src/assets/watermark.png");

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    /* =========================
   HEADER (Compact)
========================= */

    const pageWidth = doc.page.width;
    const margin = 50;
    const headerY = 35; // slightly higher

    // Smaller Logo
    doc.image(logoPath, margin, headerY, {
      width: 110, // 🔽 reduced from 140
    });

    // Horizontal line (closer to logo)
    doc
      .moveTo(margin + 130, headerY + 15)
      .lineTo(pageWidth - margin - 90, headerY + 15)
      .lineWidth(0.8) // 🔽 thinner line
      .strokeColor("#000000")
      .stroke();

    // Smaller INVOICE text
    doc
      .fontSize(16) // 🔽 reduced from 20
      .font("Helvetica")
      .text("INVOICE", pageWidth - margin - 80, headerY + 5, {
        width: 80,
        align: "right",
      });

    doc.moveDown(2); 


    const sectionTop = doc.y + 20;

    const leftX = 50;
    const rightX = doc.page.width - 200;

    /* ---------- LEFT: BILL FROM ---------- */

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("BILL FROM", leftX, sectionTop);

    doc
      .moveDown(0.5)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Propenu Solutions Private Limited", leftX);

    doc
      .moveDown(0.3)
      .fontSize(11)
      .font("Helvetica")
      .text("#191, 5th Floor, Tagore Towers,", leftX)
      .text("Kavuri Hills Phase 2,", leftX)
      .text("Hyderabad – 500033", leftX)
      .text("Website – www.propenu.com", leftX)
      .text("Email – contact@propenu.com", leftX)
      .text("Phone – 1800 41 99099", leftX);

    /* ---------- RIGHT: INVOICE DETAILS ---------- */

    doc
      .fontSize(11) // 🔽 reduced from 10
      .font("Helvetica")
      .text(`INVOICE: ${data.invoiceNo}`, rightX, sectionTop)
      .moveDown(0.5) // 🔽 reduced spacing
      .text(`DATE: ${data.date}`, rightX)
      .moveDown(0.5)
      .text(`ORDER ID: ${data.orderNo}`, rightX);

    /* ---------- BILL TO (Below BILL FROM) ---------- */

    const billToY = sectionTop + 140; // adjust spacing if needed

    doc.fontSize(11).font("Helvetica-Bold").text("BILL TO", leftX, billToY);

    doc
      .moveDown(0.3)
      .fontSize(11)
      .font("Helvetica")
      .text(data.userName || "Customer", leftX)
      .moveDown(0.15)
      .text(`${data.userPhone || "N/A"}`, leftX);

    doc.moveDown(2);

    /* =========================
   INVOICE TABLE (A4 FIXED)
========================= */

    const tableTop = doc.y + 30;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100; // full usable width
    const rowHeight = 32;

    /* --------- COLUMN WIDTHS (Percentage Based) --------- */
    const colWidths = {
      sno: tableWidth * 0.08,
      plan: tableWidth * 0.32,
      hsn: tableWidth * 0.15,
      qty: tableWidth * 0.05,
      price: tableWidth * 0.15,
      amount: tableWidth * 0.2,
    };

    /* --------- COLUMN X POSITIONS --------- */
    const colX = {
      sno: tableLeft,
      plan: tableLeft + colWidths.sno,
      hsn: tableLeft + colWidths.sno + colWidths.plan,
      qty: tableLeft + colWidths.sno + colWidths.plan + colWidths.hsn,
      price:
        tableLeft +
        colWidths.sno +
        colWidths.plan +
        colWidths.hsn +
        colWidths.qty,
      amount:
        tableLeft +
        colWidths.sno +
        colWidths.plan +
        colWidths.hsn +
        colWidths.qty +
        colWidths.price,
    };

    /* --------- HEADER BORDER --------- */
    doc.lineWidth(0.6).strokeColor("#e0e0e0");

    doc
      .moveTo(tableLeft, tableTop)
      .lineTo(tableLeft + tableWidth, tableTop)
      .stroke();

    doc
      .moveTo(tableLeft, tableTop + rowHeight)
      .lineTo(tableLeft + tableWidth, tableTop + rowHeight)
      .stroke();

    /* --------- HEADER TEXT --------- */
    doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold");

    const tableheaderY = tableTop + 10;

    doc.text("S.No", colX.sno + 5, tableheaderY, { width: colWidths.sno });
    doc.text("Plan", colX.plan + 5, tableheaderY, { width: colWidths.plan });
    doc.text("HSN Code", colX.hsn + 5, tableheaderY, { width: colWidths.hsn });
    doc.text("Qty", colX.qty + 5, tableheaderY, { width: colWidths.qty });
    doc.text("Price", colX.price + 5, tableheaderY, {
      width: colWidths.price,
      align: "right",
    });
    doc.text("Amount", colX.amount + 5, tableheaderY, {
      width: colWidths.amount,
      align: "right",
    });

    /* --------- DATA ROW BACKGROUND --------- */
    const dataRowY = tableTop + rowHeight;

    doc.rect(tableLeft, dataRowY, tableWidth, rowHeight).fill("#f4fdf8");

    doc.fillColor("#444444").fontSize(9).font("Helvetica");

    const textY = dataRowY + 10;

    /* --------- DATA VALUES --------- */
    doc.text("01", colX.sno + 5, textY, { width: colWidths.sno });
    doc.text(data.planName, colX.plan + 5, textY, { width: colWidths.plan });
    doc.text("7654", colX.hsn + 5, textY, { width: colWidths.hsn });
    doc.text("01", colX.qty + 5, textY, { width: colWidths.qty });
    doc.text(`${data.amount}`, colX.price + 5, textY, {
      width: colWidths.price,
      align: "right",
    });
    doc.text(`${(data.amount * 1.18).toFixed(2)}`, colX.amount + 5, textY, {
      width: colWidths.amount,
      align: "right",
    });

    /* --------- BOTTOM BORDER --------- */
    doc
      .moveTo(tableLeft, dataRowY + rowHeight)
      .lineTo(tableLeft + tableWidth, dataRowY + rowHeight)
      .stroke();

    doc.moveDown(4);

    /* =========================
   AMOUNT PAID SECTION (Fixed Style)
========================= */

    const cgst = data.amount * 0.09;
    const sgst = data.amount * 0.09;
    const total = data.amount + cgst + sgst;

    const blockStartY = doc.y + 20;

    doc.fillColor("#000000");

    /* ---------- LEFT BLOCK (Normal Info) ---------- */
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("GSTIN - 36AAQCP2952F1Z5", leftX, blockStartY)
      .text("PAN Number - AAQCP2952F", leftX, blockStartY + 18)
      .text("CIN Number - U70200TS2025PTC205314", leftX, blockStartY + 36);

    /* ---------- RIGHT BLOCK ---------- */

    // Title bigger
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("AMOUNT PAID", rightX, blockStartY, { align: "right" });

    // Tax lines smaller
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`CGST: Rs.${cgst.toFixed(2)}`, rightX, blockStartY + 20, {
        align: "right",
      })
      .text(`SGST: Rs.${sgst.toFixed(2)}`, rightX, blockStartY + 35, {
        align: "right",
      })
      .text(`Total: Rs.${total.toFixed(2)}`, rightX, blockStartY + 50, {
        align: "right",
      });

    // Final amount bold
    const amountBlockWidth = 180; // control how far from right
    const amountBlockX = doc.page.width - 50 - amountBlockWidth;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(
        `Amount Paid: Rs.${total.toFixed(2)}`,
        amountBlockX,
        blockStartY + 70,
        {
          width: amountBlockWidth,
          align: "right",
        },
      );

    doc.moveDown(10);

    /* Reserve space */
    /* Reserve space after amount section */
    doc.y = blockStartY + 100;

    /* =========================
   SIGNATURE BLOCK (LEFT)
========================= */
    doc.moveDown(8);

    const signatureY = doc.y + 30;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Signature", leftX, signatureY);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#444444")
      .text("Propenu Authorized", leftX, signatureY + 16);

    /* Move cursor below signature block */
    doc.y = signatureY + 60;

    /* =========================
   FOOTER (CENTERED & LIGHT)
========================= */

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#777777") // lighter grey like screenshot
      .text(
        "Congratulations, & thank you for Trusting Propenu.com. Your Subscription is active, & your journey to property connections begins now",
        50,
        doc.y,
        {
          align: "center",
          width: doc.page.width - 100, // ensures proper centering
        },
      );

    doc.end();
  });
}
