import express from "express";
import {
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplates,
} from "../../../../shared/whatsapp/templates/whatsappTemplate.controller";
import whatsappLogRouter from "../logs/whatsappLog.routes";
import { sendWhatsAppCampaignDynamic } from "../../../../shared/whatsapp/templates/whatsappTemplate.service";


const whatsappRouter = express.Router();

whatsappRouter.post("/", createWhatsAppTemplate);
whatsappRouter.get("/", getWhatsAppTemplates);
whatsappRouter.delete("/:name", deleteWhatsAppTemplate);
whatsappRouter.use("/whatsapp-logs", whatsappLogRouter);
whatsappRouter.post("/send-whatsapp", sendWhatsAppCampaignDynamic);
// whatsappRouter.post("/send-csv-bulk-whatsapp", upload.single("file"), sendWhatsAppBulkMessages);




export default whatsappRouter;
