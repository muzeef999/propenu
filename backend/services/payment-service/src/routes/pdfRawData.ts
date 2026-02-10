import { Router } from "express";
import { assignPlan, createPlan, getPlans, updatePlan } from "../controller/plan";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";

const pdfRawData = Router();

pdfRawData.get("/", async (_req, res) => {
  try {
    const pdfBuffer = await generateInvoicePdf({
      invoiceNo: "INV-001",
      userName: "Muzeef",
      planName: "Premium Listing Plan",
      amount: 4999,
      date: new Date().toDateString(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

export default pdfRawData;


