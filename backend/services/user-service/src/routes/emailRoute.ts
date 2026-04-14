import express from "express";
import {
  createEmailTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  sendCsvBulkEmail,
  sendEmailCampaignStatus,
  sendTemplateToUsers,
  updateTemplate,
} from "../../../../shared/email/templates/template.controller";

import emailLogRoutes from "../logs/emailLog.routes";
import { upload } from "../middlewares/upload";


const emailRouter = express.Router();

//gmail template
emailRouter.post("/", createEmailTemplate);
emailRouter.get("/", getAllTemplates);
emailRouter.use("/email-logs", emailLogRoutes);
emailRouter.post("/send-email", sendTemplateToUsers);
emailRouter.get("/send-email-campaign-status", sendEmailCampaignStatus);
emailRouter.post("/send-csv-bulk-email", upload.single("file"), sendCsvBulkEmail);
emailRouter.get("/:id", getTemplateById);
emailRouter.put("/:id", updateTemplate);
emailRouter.delete("/:id", deleteTemplate);


export default emailRouter;
