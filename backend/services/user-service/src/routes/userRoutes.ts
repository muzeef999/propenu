import express from "express";
import { saveFcmToken, sendCustomNotification } from "../controller/userController";
import  { upload } from "../middlewares/upload";
import { createEmailTemplate, deleteTemplate, getAllTemplates, getTemplateById, sendTemplateToUsers, updateTemplate } from "../../../../shared/email/templates/template.controller";


const router = express.Router();


router.post("/send-email-campaign", sendTemplateToUsers);

router.post("/save-fcm-token", saveFcmToken);

router.post("/admin/notify/custom", upload.single("image"), sendCustomNotification);



//gmail template


router.post("/email", createEmailTemplate);
router.get("/email", getAllTemplates);
router.get("/email/:id", getTemplateById);
router.put("/email/:id", updateTemplate);
router.delete("/email/:id", deleteTemplate);


export default router;