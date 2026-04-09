import express from "express";
import {
  createEmailTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateById,
  sendEmailCampaignStatus,
  sendTemplateToUsers,
  updateTemplate,
} from "../../../../shared/email/templates/template.controller";

const emailRouter = express.Router();


//gmail template
emailRouter.post("/", createEmailTemplate);
emailRouter.get("/", getAllTemplates);
emailRouter.get("/:id", getTemplateById);
emailRouter.put("/:id", updateTemplate);
emailRouter.delete("/:id", deleteTemplate);
emailRouter.post("/send-email", sendTemplateToUsers);
emailRouter.get("/send-email-campaign-status", sendEmailCampaignStatus);




export default emailRouter;
