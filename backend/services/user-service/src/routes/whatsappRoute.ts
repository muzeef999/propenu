import express from "express";
import {
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplates,
} from "../../../../shared/whatsapp/templates/whatsappTemplate.controller";
import whatsappLogRouter from "../logs/whatsappLog.routes";
import { sendWhatsAppBulkMessages, sendWhatsAppCampaignDynamic } from "../../../../shared/whatsapp/templates/whatsappTemplate.service";
import { upload } from "../middlewares/upload";
import { sendWhatsAppCSV } from "../../../../shared/email/templates/template.controller";
import whatsappRoutes from "../whatsapp/whatsapp.routes";


const whatsappRouter = express.Router();

whatsappRouter.post("/", createWhatsAppTemplate);
whatsappRouter.get("/", getWhatsAppTemplates);
whatsappRouter.delete("/:name", deleteWhatsAppTemplate);
whatsappRouter.use("/whatsapp-logs", whatsappLogRouter);
whatsappRouter.post("/send-whatsapp", sendWhatsAppCampaignDynamic);
whatsappRouter.post("/send-csv-bulk-whatsapp", upload.single("file"), sendWhatsAppCSV);
whatsappRouter.use("/flow", whatsappRoutes);




export default whatsappRouter;
