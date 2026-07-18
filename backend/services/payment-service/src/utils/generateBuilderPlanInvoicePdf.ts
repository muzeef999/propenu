import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import path from "path";

export async function generateBuilderPlanInvoicePdf(data: {
  invoiceNumber: string;
  invoiceDate: string;
  orderId?: string;
  builderName: string;
  companyName?: string;
  builderPhone?: string;
  builderEmail?: string;
  builderAddress?: string;
  propertyTitle: string;
  projectCode?: string;
  servicePlanName: string;
  timePeriod: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  totalAmount: number;
  discountAmount?: number;
  paidAmount: number;
}): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    const logoPath = path.join(process.cwd(), "src/assets/watermark.png");

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    const pageWidth = doc.page.width;
    const margin = 50;
    const headerY = 35;
    const leftX = 50;
    const rightX = doc.page.width - 220;

    doc.image(logoPath, margin, headerY, { width: 110 });

    doc
      .moveTo(margin + 130, headerY + 15)
      .lineTo(pageWidth - margin - 90, headerY + 15)
      .lineWidth(0.8)
      .strokeColor("#000000")
      .stroke();

    doc
      .fontSize(16)
      .font("Helvetica")
      .text("INVOICE", pageWidth - margin - 80, headerY + 5, {
        width: 80,
        align: "right",
      });

    doc.moveDown(2);

    const sectionTop = doc.y + 20;

    doc.fontSize(11).font("Helvetica-Bold").text("BILL FROM", leftX, sectionTop);

    doc
      .moveDown(0.5)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Propenu Solutions Private Limited", leftX);

    doc
      .moveDown(0.3)
      .fontSize(11)
      .font("Helvetica")
      .text("3rd Floor, SV Chambers,", leftX)
      .text("Plot No. 193, Kavuri Hills,", leftX)
      .text("Madhapur, Hyderabad - 500081.", leftX)
      .text("Website - www.propenu.com", leftX)
      .text("Email - contact@propenu.com", leftX)
      .text("Phone - 1800 41 99099", leftX);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`INVOICE: ${data.invoiceNumber}`, rightX, sectionTop)
      .moveDown(0.5)
      .text(`DATE: ${data.invoiceDate}`, rightX)
      .moveDown(0.5)
      .text(`ORDER ID: ${data.orderId || "N/A"}`, rightX)
      .moveDown(0.5)
      .text(`PROJECT CODE: ${data.projectCode || "N/A"}`, rightX)
      .moveDown(0.5)
      .text(`STATUS: ${data.paymentStatus}`, rightX);

    const billToY = sectionTop + 140;

    doc.fontSize(11).font("Helvetica-Bold").text("BILL TO", leftX, billToY);

    doc
      .moveDown(0.3)
      .fontSize(11)
      .font("Helvetica")
      .text(data.builderName || "Builder", leftX);

    if (data.companyName) doc.text(data.companyName, leftX);
    if (data.builderPhone) doc.text(data.builderPhone, leftX);
    if (data.builderEmail) doc.text(data.builderEmail, leftX);

    if (data.builderAddress) {
      doc.text(data.builderAddress, leftX, undefined, { width: 260 });
    }

    doc.moveDown(2);

    const tableTop = doc.y + 30;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100;
    const rowHeight = 32;

    const colWidths = {
      sno: tableWidth * 0.08,
      plan: tableWidth * 0.24,
      property: tableWidth * 0.24,
      period: tableWidth * 0.14,
      amount: tableWidth * 0.12,
      paid: tableWidth * 0.18,
    };

    const colX = {
      sno: tableLeft,
      plan: tableLeft + colWidths.sno,
      property: tableLeft + colWidths.sno + colWidths.plan,
      period: tableLeft + colWidths.sno + colWidths.plan + colWidths.property,
      amount:
        tableLeft +
        colWidths.sno +
        colWidths.plan +
        colWidths.property +
        colWidths.period,
      paid:
        tableLeft +
        colWidths.sno +
        colWidths.plan +
        colWidths.property +
        colWidths.period +
        colWidths.amount,
    };

    doc.lineWidth(0.6).strokeColor("#e0e0e0");
    doc.moveTo(tableLeft, tableTop).lineTo(tableLeft + tableWidth, tableTop).stroke();
    doc
      .moveTo(tableLeft, tableTop + rowHeight)
      .lineTo(tableLeft + tableWidth, tableTop + rowHeight)
      .stroke();

    doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold");

    const tableHeaderY = tableTop + 10;
    doc.text("S.No", colX.sno + 5, tableHeaderY, { width: colWidths.sno });
    doc.text("Plan", colX.plan + 5, tableHeaderY, { width: colWidths.plan });
    doc.text("Project", colX.property + 5, tableHeaderY, { width: colWidths.property });
    doc.text("Period", colX.period + 5, tableHeaderY, { width: colWidths.period });
    doc.text("Amount", colX.amount + 5, tableHeaderY, {
      width: colWidths.amount,
      align: "right",
    });
    doc.text("Paid", colX.paid + 5, tableHeaderY, {
      width: colWidths.paid,
      align: "right",
    });

    const dataRowY = tableTop + rowHeight;
    doc.rect(tableLeft, dataRowY, tableWidth, rowHeight).fill("#f4fdf8");
    doc.fillColor("#444444").fontSize(9).font("Helvetica");

    const textY = dataRowY + 10;
    doc.text("01", colX.sno + 5, textY, { width: colWidths.sno });
    doc.text(data.servicePlanName, colX.plan + 5, textY, { width: colWidths.plan });
    doc.text(data.propertyTitle, colX.property + 5, textY, { width: colWidths.property });
    doc.text(data.timePeriod, colX.period + 5, textY, { width: colWidths.period });
    doc.text(`${data.totalAmount.toFixed(2)}`, colX.amount + 5, textY, {
      width: colWidths.amount,
      align: "right",
    });
    doc.text(`${data.paidAmount.toFixed(2)}`, colX.paid + 5, textY, {
      width: colWidths.paid,
      align: "right",
    });

    doc
      .moveTo(tableLeft, dataRowY + rowHeight)
      .lineTo(tableLeft + tableWidth, dataRowY + rowHeight)
      .stroke();

    const discountAmount = data.discountAmount || 0;
    const subtotal = data.subtotalAmount ?? data.totalAmount + discountAmount;
    const gstRate = data.gstRate || 0;
    const gstAmount = data.gstAmount || 0;
    const blockStartY = dataRowY + 80;

    doc.fillColor("#000000");

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("GSTIN - 36AAQCP2952F1Z5", leftX, blockStartY)
      .text("PAN Number - AAQCP2952F", leftX, blockStartY + 18)
      .text("CIN Number - U70200TS2025PTC205314", leftX, blockStartY + 36)
      .text(`Payment Method - ${data.paymentMethod}`, leftX, blockStartY + 54);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Amount Summary", rightX, blockStartY, {
        align: "right",
        width: 170,
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Subtotal: Rs.${subtotal.toFixed(2)}`, rightX, blockStartY + 20, {
        align: "right",
        width: 170,
      })
      .text(`Discount: Rs.${discountAmount.toFixed(2)}`, rightX, blockStartY + 35, {
        align: "right",
        width: 170,
      })
      .text(`GST (${gstRate}%): Rs.${gstAmount.toFixed(2)}`, rightX, blockStartY + 50, {
        align: "right",
        width: 170,
      })
      .text(`Total: Rs.${data.totalAmount.toFixed(2)}`, rightX, blockStartY + 65, {
        align: "right",
        width: 170,
      });

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`Amount Paid: Rs.${data.paidAmount.toFixed(2)}`, rightX, blockStartY + 92, {
        width: 170,
        align: "right",
      });

    const signatureY = blockStartY + 155;

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

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#777777")
      .text(
        "Thank you for choosing Propenu. Your builder promotion invoice has been generated successfully.",
        50,
        signatureY + 70,
        {
          align: "center",
          width: doc.page.width - 100,
        },
      );

    doc.end();
  });
}
