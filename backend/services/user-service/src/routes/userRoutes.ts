import express from "express";
import { saveFcmToken, sendCustomNotification } from "../controller/userController";
import  { upload } from "../middlewares/upload";
import { createEmailTemplate, deleteTemplate, getAllTemplates, getTemplateById, sendTemplateToUsers, updateTemplate } from "../../../../shared/email/templates/template.controller";
import { createWhatsAppTemplate, deleteWhatsAppTemplate, getWhatsAppTemplates } from "../../../../shared/whatsapp/templates/whatsappTemplate.controller";

const router = express.Router();

router.post("/send-email-campaign", sendTemplateToUsers);
router.post("/save-fcm-token", saveFcmToken);
router.post("/admin/notify/custom", upload.single("image"), sendCustomNotification);

console.log("User routes initialized");

//gmail template
router.post("/email", createEmailTemplate);
router.get("/email", getAllTemplates);
router.get("/email/:id", getTemplateById);
router.put("/email/:id", updateTemplate);
router.delete("/email/:id", deleteTemplate);


router.post("/whatsapp/template", createWhatsAppTemplate);
router.get("/whatsapp/template", getWhatsAppTemplates);
router.delete("/whatsapp/template/:name", deleteWhatsAppTemplate);


export default router;