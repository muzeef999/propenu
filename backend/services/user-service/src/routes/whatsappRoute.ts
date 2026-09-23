import express from "express";
import {
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplates,
} from "../../../../shared/whatsapp/templates/whatsappTemplate.controller";
import whatsappLogRouter from "../logs/whatsappLog.routes";
import { sendWhatsAppCampaignDynamic } from "../../../../shared/whatsapp/templates/whatsappTemplate.service";
import { upload, uploadNotificationImage, uploadWhatsAppTemplateMediaMulter } from "../middlewares/upload";
import { sendWhatsAppCSV } from "../../../../shared/email/templates/template.controller";
import whatsappRoutes from "../whatsapp/whatsapp.routes";
import { whatsappInboxRouter } from "../../../../shared/whatsapp/inbox";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  uploadWhatsAppCampaignImage,
  uploadWhatsAppTemplateMedia,
} from "../controller/whatsappCampaignUpload.controller";

const whatsappRouter = express.Router();

whatsappRouter.use("/flow", whatsappRoutes);
whatsappRouter.use("/inbox", authMiddleware, whatsappInboxRouter);
whatsappRouter.use("/whatsapp-logs", whatsappLogRouter);

whatsappRouter.post("/", createWhatsAppTemplate);
whatsappRouter.get("/", getWhatsAppTemplates);
whatsappRouter.post("/send-whatsapp", sendWhatsAppCampaignDynamic);
whatsappRouter.post(
  "/upload-campaign-image",
  uploadNotificationImage.single("image"),
  uploadWhatsAppCampaignImage,
);
/** Meta Resumable Upload → header_handle for IMAGE/VIDEO/DOCUMENT template create */
whatsappRouter.post(
  "/upload-template-media",
  uploadWhatsAppTemplateMediaMulter.single("file"),
  uploadWhatsAppTemplateMedia,
);
whatsappRouter.post(
  "/send-csv-bulk-whatsapp",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "headerImage", maxCount: 1 },
  ]),
  sendWhatsAppCSV,
);
whatsappRouter.delete("/:name", deleteWhatsAppTemplate);

export default whatsappRouter;
