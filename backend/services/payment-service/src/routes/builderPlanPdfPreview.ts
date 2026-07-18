import { Router } from "express";
import { generateBuilderPlanInvoicePdf } from "../utils/generateBuilderPlanInvoicePdf";

const builderPlanPdfPreview = Router();

builderPlanPdfPreview.get("/", async (_req, res) => {
  try {
    const pdfBuffer = await generateBuilderPlanInvoicePdf({
      invoiceNumber: "PNU1001",
      invoiceDate: new Date().toDateString(),
      orderId: "ORD1001",
      builderName: "Muzeef Shaik",
      companyName: "Propenu",
      builderPhone: "9959456647",
      builderEmail: "shaikmuzeef9999@gmail.com",
      builderAddress: "Kondapur, Hyderabad, Telangana - 500081",
      propertyTitle: "Skyline Heights",
      projectCode: "84834706",
      servicePlanName: "30 Days Premium Listing",
      timePeriod: "1_month",
      paymentMethod: "cash",
      paymentStatus: "paid",
      subtotalAmount: 5000,
      gstRate: 18,
      gstAmount: 900,
      totalAmount: 5400,
      discountAmount: 500,
      paidAmount: 5400,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=builder-plan-invoice.pdf",
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Builder plan PDF generation failed" });
  }
});

export default builderPlanPdfPreview;
